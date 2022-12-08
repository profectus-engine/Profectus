import { isArray } from "@vue/shared";
import { globalBus } from "game/events";
import type { GenericLayer } from "game/layers";
import { addingLayers, persistentRefs } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { ProxyState } from "util/proxies";
import type { Ref, WritableComputedRef } from "vue";
import { computed, isReactive, isRef, ref } from "vue";

/**
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[PersistentState]}
 */
export const PersistentState = Symbol("PersistentState");
/**
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[DefaultValue]}
 */
export const DefaultValue = Symbol("DefaultValue");
/**
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[StackTrace]}
 */
export const StackTrace = Symbol("StackTrace");
/**
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[Deleted]}
 */
export const Deleted = Symbol("Deleted");
/**
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[NonPersistent]}
 */
export const NonPersistent = Symbol("NonPersistent");
/**
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[SaveDataPath]}
 */
export const SaveDataPath = Symbol("SaveDataPath");

/**
 * This is a union of things that should be safely stringifiable without needing special processes or knowing what to load them in as.
 * - Decimals aren't allowed because we'd need to know to parse them back.
 * - DecimalSources are allowed because the string is a valid value for them
 */
export type State =
    | string
    | number
    | boolean
    | DecimalSource
    | { [key: string]: State }
    | { [key: number]: State };

/**
 * A {@link Ref} that has been augmented with properties to allow it to be saved and loaded within the player save data object.
 */
export type Persistent<T extends State = State> = Ref<T> & {
    /** A flag that this is a persistent property. Typically a circular reference. */
    [PersistentState]: Ref<T>;
    /** The value the ref should be set to in a fresh save, or when updating an old save to the current version. */
    [DefaultValue]: T;
    /** The stack trace of where the persistent ref was created. This is used for debugging purposes when a persistent ref is created but not placed in its layer object. */
    [StackTrace]: string;
    /**
     * This is a flag that can be set once the option func is evaluated, to mark that a persistent ref should _not_ be saved to the player save data object.
     * @see {@link deletePersistent} for marking a persistent ref as deleted.
     */
    [Deleted]: boolean;
    /**
     * A non-persistent ref that just reads and writes ot the persistent ref. Used for passing to other features without duplicating the persistent ref in the constructed save data object.
     */
    [NonPersistent]: NonPersistent<T>;
    /**
     * The path this persistent appears in within the save data object. Predominantly used to ensure it's only placed in there one time.
     */
    [SaveDataPath]: string[] | undefined;
};

export type NonPersistent<T extends State = State> = WritableComputedRef<T> & { [DefaultValue]: T };

function getStackTrace() {
    return (
        new Error().stack
            ?.split("\n")
            .slice(3, 5)
            .map(line => line.trim())
            .join("\n") || ""
    );
}

/**
 * Create a persistent ref, which can be saved and loaded.
 * All (non-deleted) persistent refs must be included somewhere within the layer object returned by that layer's options func.
 * @param defaultValue The value the persistent ref should start at on fresh saves or when reset.
 */
export function persistent<T extends State>(defaultValue: T | Ref<T>): Persistent<T> {
    const persistent = (
        isRef(defaultValue) ? defaultValue : (ref<T>(defaultValue) as unknown)
    ) as Persistent<T>;

    persistent[PersistentState] = persistent;
    persistent[DefaultValue] = isRef(defaultValue) ? defaultValue.value : defaultValue;
    persistent[StackTrace] = getStackTrace();
    persistent[Deleted] = false;
    const nonPersistent: Partial<NonPersistent<T>> = computed({
        get() {
            return persistent.value;
        },
        set(value) {
            persistent.value = value;
        }
    });
    nonPersistent[DefaultValue] = persistent[DefaultValue];
    persistent[NonPersistent] = nonPersistent as NonPersistent<T>;
    persistent[SaveDataPath] = undefined;

    if (addingLayers.length === 0) {
        console.warn(
            "Creating a persistent ref outside of a layer. This is not officially supported",
            persistent,
            "\nCreated at:\n" + persistent[StackTrace]
        );
    } else {
        persistentRefs[addingLayers[addingLayers.length - 1]].add(persistent);
    }

    return persistent as Persistent<T>;
}

/**
 * Type guard for whether an arbitrary value is a persistent ref
 * @param value The value that may or may not be a persistent ref
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPersistent(value: any): value is Persistent {
    return value && typeof value === "object" && PersistentState in value;
}

/**
 * Unwraps the non-persistent ref inside of persistent refs, to be passed to other features without duplicating values in the save data object.
 * @param persistent The persistent ref to unwrap
 */
export function noPersist<T extends Persistent<S>, S extends State>(
    persistent: T
): T[typeof NonPersistent] {
    return persistent[NonPersistent];
}

/**
 * Mark a {@link Persistent} as deleted, so it won't be saved and loaded.
 * Since persistent refs must be created during a layer's options func, features can not create persistent refs after evaluating their own options funcs.
 * As a result, it must create any persistent refs it _might_ need.
 * This function can then be called after the options func is evaluated to mark the persistent ref to not be saved or loaded.
 */
export function deletePersistent(persistent: Persistent) {
    if (addingLayers.length === 0) {
        console.warn("Deleting a persistent ref outside of a layer. Ignoring...", persistent);
    } else {
        persistentRefs[addingLayers[addingLayers.length - 1]].delete(persistent);
    }
    persistent[Deleted] = true;
}

globalBus.on("addLayer", (layer: GenericLayer, saveData: Record<string, unknown>) => {
    const features: { type: typeof Symbol }[] = [];
    const handleObject = (obj: Record<string, unknown>, path: string[] = []): boolean => {
        let foundPersistent = false;
        Object.keys(obj).forEach(key => {
            let value = obj[key];
            if (value && typeof value === "object") {
                if (ProxyState in value) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value = (value as any)[ProxyState] as object;
                }
                if (isPersistent(value)) {
                    foundPersistent = true;
                    if (value[Deleted]) {
                        console.warn(
                            "Deleted persistent ref present in returned object. Ignoring...",
                            value,
                            "\nCreated at:\n" + value[StackTrace]
                        );
                        return;
                    }
                    persistentRefs[layer.id].delete(value);

                    // Handle SaveDataPath
                    const newPath = [layer.id, ...path, key];
                    if (
                        value[SaveDataPath] != undefined &&
                        JSON.stringify(newPath) !== JSON.stringify(value[SaveDataPath])
                    ) {
                        console.error(
                            `Persistent ref is being saved to \`${newPath.join(
                                "."
                            )}\` when it's already present at \`${value[SaveDataPath].join(
                                "."
                            )}\`. This can cause unexpected behavior when loading saves between updates.`,
                            value
                        );
                    }
                    value[SaveDataPath] = newPath;

                    // Construct save path if it doesn't exist
                    const persistentState = path.reduce<Record<string, unknown>>((acc, curr) => {
                        if (!(curr in acc)) {
                            acc[curr] = {};
                        }
                        return acc[curr] as Record<string, unknown>;
                    }, saveData);

                    // Cache currently saved value
                    const savedValue = persistentState[key];
                    // Add ref to save data
                    persistentState[key] = value[PersistentState];
                    // Load previously saved value
                    if (isReactive(persistentState)) {
                        if (savedValue != null) {
                            persistentState[key] = savedValue;
                        } else {
                            persistentState[key] = value[DefaultValue];
                        }
                    } else {
                        if (savedValue != null) {
                            (persistentState[key] as Ref<unknown>).value = savedValue;
                        } else {
                            (persistentState[key] as Ref<unknown>).value = value[DefaultValue];
                        }
                    }
                } else if (
                    !(value instanceof Decimal) &&
                    !isRef(value) &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    !features.includes(value as { type: typeof Symbol })
                ) {
                    if (typeof (value as { type: typeof Symbol }).type === "symbol") {
                        features.push(value as { type: typeof Symbol });
                    }

                    // Continue traversing
                    const foundPersistentInChild = handleObject(value as Record<string, unknown>, [
                        ...path,
                        key
                    ]);

                    // Show warning for persistent values inside arrays
                    // TODO handle arrays better
                    if (foundPersistentInChild) {
                        if (isArray(value) && !isArray(obj)) {
                            console.warn(
                                "Found array that contains persistent values when adding layer. Keep in mind changing the order of elements in the array will mess with existing player saves.",
                                ProxyState in obj
                                    ? (obj as Record<PropertyKey, unknown>)[ProxyState]
                                    : obj,
                                key
                            );
                        } else {
                            foundPersistent = true;
                        }
                    }
                }
            }
        });
        return foundPersistent;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleObject((layer as any)[ProxyState]);
    persistentRefs[layer.id].forEach(persistent => {
        console.error(
            `Created persistent ref in ${layer.id} without registering it to the layer! Make sure to include everything persistent in the returned object`,
            persistent,
            "\nCreated at:\n" + persistent[StackTrace]
        );
    });
    persistentRefs[layer.id].clear();
});
