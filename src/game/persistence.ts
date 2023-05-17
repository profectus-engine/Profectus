import { isArray } from "@vue/shared";
import { globalBus } from "game/events";
import type { GenericLayer } from "game/layers";
import { addingLayers, persistentRefs } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { ProxyState } from "util/proxies";
import type { Ref, WritableComputedRef } from "vue";
import { computed, isReactive, isRef, ref } from "vue";
import player from "./player";
import state from "./state";
import Formula from "./formulas/formulas";

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
 * A symbol used in {@link Persistent} objects.
 * @see {@link Persistent[CheckNaN]}
 */
export const CheckNaN = Symbol("CheckNaN");

/**
 * A symbol used to flag objects that should not be checked for persistent values.
 */
export const SkipPersistence = Symbol("SkipPersistence");

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
    value: T;
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
    /**
     * Whether or not to NaN-check this ref. Should only be true on values expected to always be DecimalSources.
     */
    [CheckNaN]: boolean;
};

export type NonPersistent<T extends State = State> = WritableComputedRef<T> & { [DefaultValue]: T };

function getStackTrace() {
    return (
        new Error().stack
            ?.split("\n")
            .slice(3, 5)
            .map(line => line.trim())
            .join("\n") ?? ""
    );
}

function checkNaNAndWrite<T extends State>(persistent: Persistent<T>, value: T) {
    // Decimal is smart enough to return false on things that aren't supposed to be numbers
    if (Decimal.isNaN(value as DecimalSource)) {
        if (!state.hasNaN) {
            player.autosave = false;
            state.hasNaN = true;
            state.NaNPath = persistent[SaveDataPath];
            state.NaNPersistent = persistent as Persistent<DecimalSource>;
        }
        console.error(`Attempted to save NaN value to ${persistent[SaveDataPath]?.join(".")}`);
    }
    persistent[PersistentState].value = value;
}

/**
 * Create a persistent ref, which can be saved and loaded.
 * All (non-deleted) persistent refs must be included somewhere within the layer object returned by that layer's options func.
 * @param defaultValue The value the persistent ref should start at on fresh saves or when reset.
 * @param checkNaN Whether or not to check this ref for being NaN on set. Only use on refs that should always be DecimalSources.
 */
export function persistent<T extends State>(
    defaultValue: T | Ref<T>,
    checkNaN = true
): Persistent<T> {
    const persistentState: Ref<T> = isRef(defaultValue)
        ? defaultValue
        : (ref<T>(defaultValue) as Ref<T>);

    if (isRef(defaultValue)) {
        defaultValue = defaultValue.value;
    }

    const nonPersistent = computed({
        get() {
            return persistentState.value;
        },
        set(value) {
            if (checkNaN) {
                checkNaNAndWrite(persistent, value);
            } else {
                persistent[PersistentState].value = value;
            }
        }
    }) as NonPersistent<T>;
    nonPersistent[DefaultValue] = defaultValue;

    // We're trying to mock a vue ref, which means the type expects a private [RefSymbol] property that we can't access, but the actual implementation of isRef just checks for `__v_isRef`
    const persistent = {
        get value() {
            return persistentState.value as T;
        },
        set value(value: T) {
            if (checkNaN) {
                checkNaNAndWrite(persistent, value);
            } else {
                persistent[PersistentState].value = value;
            }
        },
        __v_isRef: true,
        [PersistentState]: persistentState,
        [DefaultValue]: defaultValue,
        [StackTrace]: getStackTrace(),
        [Deleted]: false,
        [NonPersistent]: nonPersistent,
        [SaveDataPath]: undefined
    } as unknown as Persistent<T>;

    if (addingLayers.length === 0) {
        console.warn(
            "Creating a persistent ref outside of a layer. This is not officially supported",
            persistent,
            "\nCreated at:\n" + persistent[StackTrace]
        );
    } else {
        persistentRefs[addingLayers[addingLayers.length - 1]].add(persistent);
    }

    return persistent;
}

/**
 * Type guard for whether an arbitrary value is a persistent ref
 * @param value The value that may or may not be a persistent ref
 */
export function isPersistent(value: unknown): value is Persistent {
    return value != null && typeof value === "object" && PersistentState in value;
}

/**
 * Unwraps the non-persistent ref inside of persistent refs, to be passed to other features without duplicating values in the save data object.
 * @param persistent The persistent ref to unwrap, or an object to ignore all persistent refs within
 */
export function noPersist<T extends Persistent<S>, S extends State>(
    persistent: T
): T[typeof NonPersistent];
export function noPersist<T extends object>(persistent: T): T;
export function noPersist<T extends Persistent<S>, S extends State>(persistent: T | object) {
    // Check for proxy state so if it's a lazy proxy we don't evaluate it's function
    // Lazy proxies are not persistent refs themselves, so we know we want to wrap them
    return !(ProxyState in persistent) && NonPersistent in persistent
        ? persistent[NonPersistent]
        : new Proxy(persistent, {
              get(target, p) {
                  if (p === PersistentState) {
                      return undefined;
                  }
                  if (p === SkipPersistence) {
                      return true;
                  }
                  return target[p as keyof typeof target];
              },
              set(target, key, value) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (target as Record<PropertyKey, any>)[key] = value;
                  return true;
              },
              has(target, key) {
                  if (key === PersistentState) {
                      return false;
                  }
                  if (key == SkipPersistence) {
                      return true;
                  }
                  return Reflect.has(target, key);
              }
          });
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
            if (value != null && typeof value === "object") {
                if ((value as Record<PropertyKey, unknown>)[SkipPersistence] === true) {
                    return;
                }
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
                            )}\`.`,
                            "This can cause unexpected behavior when loading saves between updates."
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
                    !(value instanceof Formula) &&
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
        if (persistent[Deleted]) {
            return;
        }
        console.error(
            `Created persistent ref in ${layer.id} without registering it to the layer!`,
            "Make sure to include everything persistent in the returned object.\n\nCreated at:\n" +
                persistent[StackTrace]
        );
    });
    persistentRefs[layer.id].clear();
});
