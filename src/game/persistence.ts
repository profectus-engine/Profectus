import { globalBus } from "game/events";
import Decimal, { DecimalSource } from "util/bignum";
import { ProxyState } from "util/proxies";
import { isArray } from "@vue/shared";
import { isRef, Ref, ref } from "vue";
import { GenericLayer } from "./layers";

export const PersistentState = Symbol("PersistentState");
export const DefaultValue = Symbol("DefaultValue");

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

export type Persistent<T extends State = State> = {
    [PersistentState]: Ref<T>;
    [DefaultValue]: T;
};
export type PersistentRef<T extends State = State> = Ref<T> & Persistent<T>;

export function persistent<T extends State>(defaultValue: T | Ref<T>): PersistentRef<T> {
    const persistent = (
        isRef(defaultValue) ? defaultValue : (ref<T>(defaultValue) as unknown)
    ) as PersistentRef<T>;

    persistent[PersistentState] = persistent;
    persistent[DefaultValue] = isRef(defaultValue) ? defaultValue.value : defaultValue;
    return persistent as PersistentRef<T>;
}

export function makePersistent<T extends State>(
    obj: unknown,
    defaultValue: T
): asserts obj is Persistent<T> {
    const persistent = obj as Partial<Persistent<T>>;
    const state = ref(defaultValue) as Ref<T>;

    persistent[PersistentState] = state;
    persistent[DefaultValue] = isRef(defaultValue) ? (defaultValue.value as T) : defaultValue;
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
                    if (savedValue != null) {
                        (persistentState[key] as Ref<unknown>).value = savedValue;
                    } else {
                        (persistentState[key] as Ref<unknown>).value = (value as Persistent)[
                            DefaultValue
                        ];
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
});
