import { globalBus } from "@/game/events";
import { GenericLayer } from "@/game/layers";
import Decimal, { DecimalSource } from "@/util/bignum";
import { DoNotCache, ProcessedComputable } from "@/util/computed";
import { ProxyState } from "@/util/proxies";
import { isArray } from "@vue/shared";
import { CSSProperties, DefineComponent, isRef, ref, Ref } from "vue";

export const PersistentState = Symbol("PersistentState");
export const DefaultValue = Symbol("DefaultValue");
export const Component = Symbol("Component");
export const GatherProps = Symbol("GatherProps");

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
export type JSXFunction = (() => JSX.Element) & { [DoNotCache]: true };
export type CoercableComponent = string | DefineComponent | JSXFunction;
export type StyleValue = string | CSSProperties | Array<string | CSSProperties>;

export type Persistent<T extends State = State> = {
    [PersistentState]: Ref<T>;
    [DefaultValue]: T;
};
export type PersistentRef<T extends State = State> = Ref<T> & Persistent<T>;

// TODO if importing .vue components in .tsx can become type safe,
// this type can probably be safely removed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericComponent = DefineComponent<any, any, any>;

export type FeatureComponent<T> = Omit<
    {
        [K in keyof T]: T[K] extends ProcessedComputable<infer S> ? S : T[K];
    },
    typeof Component | typeof DefaultValue
>;

export type Replace<T, S> = S & Omit<T, keyof S>;

let id = 0;
// Get a unique ID to allow a feature to be found for creating branches
// and any other uses requiring unique identifiers for each feature
// IDs are gauranteed unique, but should not be saved as they are not
// guaranteed to be persistent through updates and such
export function getUniqueID(prefix = "feature-"): string {
    return prefix + id++;
}

export enum Visibility {
    Visible,
    Hidden,
    None
}

export function jsx(func: () => JSX.Element | ""): JSXFunction {
    (func as Partial<JSXFunction>)[DoNotCache] = true;
    return func as JSXFunction;
}

export function showIf(condition: boolean, otherwise = Visibility.None): Visibility {
    return condition ? Visibility.Visible : otherwise;
}

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

export function setDefault<T, K extends keyof T>(
    object: T,
    key: K,
    value: T[K]
): asserts object is Exclude<T, K> & Required<Pick<T, K>> {
    if (object[key] === undefined && value != undefined) {
        object[key] = value;
    }
}

export function findFeatures(obj: Record<string, unknown>, type: symbol): unknown[] {
    const objects: unknown[] = [];
    const handleObject = (obj: Record<string, unknown>) => {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value && typeof value === "object") {
                if ((value as Record<string, unknown>).type === type) {
                    objects.push(value);
                } else if (!(value instanceof Decimal) && !isRef(value)) {
                    handleObject(value as Record<string, unknown>);
                }
            }
        });
    };
    handleObject(obj);
    return objects;
}

globalBus.on("addLayer", (layer: GenericLayer, saveData: Record<string, unknown>) => {
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
                } else if (!(value instanceof Decimal) && !isRef(value)) {
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
