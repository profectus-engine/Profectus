import { globalBus } from "game/events";
import Decimal, { DecimalSource } from "util/bignum";
import { ProxyState } from "util/proxies";
import { isArray } from "@vue/shared";
import { isReactive, isRef, Ref, ref } from "vue";
import { addingLayers, GenericLayer, persistentRefs } from "./layers";

export const PersistentState = Symbol("PersistentState");
export const DefaultValue = Symbol("DefaultValue");
export const StackTrace = Symbol("StackTrace");
export const Deleted = Symbol("Deleted");

// Note: This is a union of things that should be safely stringifiable without needing
// special processes for knowing what to load them in as
// - Decimals aren't allowed because we'd need to know to parse them back.
// - DecimalSources are allowed because the string is a valid value for them
export type State =
    | string
    | number
    | boolean
    | DecimalSource
    | { [key: string]: State }
    | { [key: number]: State };

export type Persistent<T extends State = State> = Ref<T> & {
    [PersistentState]: Ref<T>;
    [DefaultValue]: T;
    [StackTrace]: string;
    [Deleted]: boolean;
};

function getStackTrace() {
    return (
        new Error().stack
            ?.split("\n")
            .slice(3, 5)
            .map(line => line.trim())
            .join("\n") || ""
    );
}

export function persistent<T extends State>(defaultValue: T | Ref<T>): Persistent<T> {
    const persistent = (
        isRef(defaultValue) ? defaultValue : (ref<T>(defaultValue) as unknown)
    ) as Persistent<T>;

    persistent[PersistentState] = persistent;
    persistent[DefaultValue] = isRef(defaultValue) ? defaultValue.value : defaultValue;
    persistent[StackTrace] = getStackTrace();
    persistent[Deleted] = false;

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
            const value = obj[key];
            if (value && typeof value === "object") {
                if (PersistentState in value) {
                    foundPersistent = true;
                    if ((value as Persistent)[Deleted]) {
                        console.warn(
                            "Deleted persistent ref present in returned object. Ignoring...",
                            value,
                            "\nCreated at:\n" + (value as Persistent)[StackTrace]
                        );
                        return;
                    }
                    persistentRefs[layer.id].delete(
                        ProxyState in value
                            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              ((value as any)[ProxyState] as Persistent)
                            : (value as Persistent)
                    );

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
                    persistentState[key] = (value as Persistent)[PersistentState];
                    // Load previously saved value
                    if (isReactive(persistentState)) {
                        if (savedValue != null) {
                            persistentState[key] = savedValue;
                        } else {
                            persistentState[key] = (value as Persistent)[DefaultValue];
                        }
                    } else {
                        if (savedValue != null) {
                            (persistentState[key] as Ref<unknown>).value = savedValue;
                        } else {
                            (persistentState[key] as Ref<unknown>).value = (value as Persistent)[
                                DefaultValue
                            ];
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
    handleObject(layer);
    persistentRefs[layer.id].forEach(persistent => {
        console.error(
            `Created persistent ref in ${layer.id} without registering it to the layer! Make sure to include everything persistent in the returned object`,
            persistent,
            "\nCreated at:\n" + persistent[StackTrace]
        );
    });
    persistentRefs[layer.id].clear();
});
