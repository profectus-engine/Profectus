import { DefaultValue } from "game/persistence";
import Decimal from "util/bignum";
import { DoNotCache, ProcessedComputable } from "util/computed";
import { CSSProperties, DefineComponent, isRef } from "vue";

export const Component = Symbol("Component");
export const GatherProps = Symbol("GatherProps");

export type JSXFunction = (() => JSX.Element) & { [DoNotCache]: true };
export type CoercableComponent = string | DefineComponent | JSXFunction;
export type StyleValue = string | CSSProperties | Array<string | CSSProperties>;

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

export type OptionsFunc<T, S = T, R = Record<string, unknown>> = () => T & ThisType<S> & Partial<R>;

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
