import { globalBus } from "@/game/events";
import { GenericLayer } from "@/game/layers";
import Decimal, { DecimalSource } from "@/util/bignum";
import { ProcessedComputable } from "@/util/computed";
import { isArray } from "@vue/shared";
import { ComponentOptions, CSSProperties, DefineComponent, isRef, ref, Ref } from "vue";

export const SetupPersistence = Symbol("SetupPersistence");
export const DefaultValue = Symbol("DefaultValue");
export const Component = Symbol("Component");

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
export type CoercableComponent = string | ComponentOptions | DefineComponent | JSX.Element;
export type StyleValue = string | CSSProperties | Array<StyleValue>;

export type Persistent<T extends State = State> = {
    state: Ref<T>;
    [DefaultValue]: T;
    [SetupPersistence]: () => Ref<T>;
};

export type PersistentRef<T extends State = State> = Ref<T> & {
    [DefaultValue]: T;
    [SetupPersistence]: () => Ref<T>;
};

// TODO if importing .vue components in .tsx can become type safe,
// this type can probably be safely removed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericComponent = DefineComponent<any, any, any>;

// Example usage: `<Upgrade {...wrapComputable<GenericUpgrade>(upgrade)} />`
export function wrapFeature<T>(component: T): FeatureComponent<T> {
    // TODO is this okay, or do we actually need to unref each property?
    return (component as unknown) as FeatureComponent<T>;
}

export type FeatureComponent<T> = Omit<
    {
        [K in keyof T]: T[K] extends ProcessedComputable<infer S> ? S : T[K];
    },
    typeof Component | typeof DefaultValue | typeof SetupPersistence
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

export function showIf(condition: boolean, otherwise = Visibility.None): Visibility {
    return condition ? Visibility.Visible : otherwise;
}

export function persistent<T extends State>(defaultValue: T | Ref<T>): PersistentRef<T> {
    const persistent = isRef(defaultValue) ? defaultValue : (ref(defaultValue) as Ref<T>);
    ((persistent as unknown) as PersistentRef<T>)[DefaultValue] = isRef(defaultValue)
        ? defaultValue.value
        : defaultValue;
    ((persistent as unknown) as PersistentRef<T>)[SetupPersistence] = function() {
        return persistent;
    };
    return (persistent as unknown) as PersistentRef<T>;
}

export function makePersistent<T extends State>(
    obj: unknown,
    defaultValue: T
): asserts obj is Persistent<T> {
    const persistent = obj as Partial<Persistent<T>>;
    const state = ref(defaultValue) as Ref<T>;

    Object.defineProperty(persistent, "state", {
        get: () => {
            return state.value;
        },
        set: (val: T) => {
            state.value = val;
        }
    });
    persistent[DefaultValue] = isRef(defaultValue) ? (defaultValue.value as T) : defaultValue;
    persistent[SetupPersistence] = function() {
        return state;
    };
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
                } else {
                    handleObject(value as Record<string, unknown>);
                }
            }
        });
    };
    handleObject(obj);
    return objects;
}

globalBus.on("addLayer", (layer: GenericLayer, saveData: Record<string, unknown>) => {
    const handleObject = (
        obj: Record<string, unknown>,
        persistentState: Record<string, unknown>,
        foundArray: boolean
    ) => {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value && typeof value === "object") {
                const warnArray = foundArray || isArray(value);
                if (SetupPersistence in value) {
                    if (warnArray) {
                        console.warn(
                            "Found persistent property inside array when adding layer. Keep in mind changing the order of persistent objects in an array will mess with existing player saves.",
                            layer
                        );
                    }
                    const savedValue = persistentState[key];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    persistentState[key] = (value as PersistentRef | Persistent)[
                        SetupPersistence
                    ]();
                    if (savedValue != null) {
                        (persistentState[key] as Ref<unknown>).value = savedValue;
                    }
                } else if (!(value instanceof Decimal)) {
                    if (typeof persistentState[key] !== "object") {
                        persistentState[key] = {};
                    }
                    handleObject(
                        value as Record<string, unknown>,
                        persistentState[key] as Record<string, unknown>,
                        warnArray
                    );
                }
            }
        });
    };
    handleObject(layer, saveData, false);
});
