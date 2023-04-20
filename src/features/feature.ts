import Decimal from "util/bignum";
import { DoNotCache, ProcessedComputable } from "util/computed";
import type { CSSProperties, DefineComponent } from "vue";
import { isRef, unref } from "vue";

/**
 * A symbol to use as a key for a vue component a feature can be rendered with
 * @see {@link util/vue.VueFeature}
 */
export const Component = Symbol("Component");
/**
 * A symbol to use as a key for a prop gathering function that a feature can use to send to its component
 * @see {@link util/vue.VueFeature}
 */
export const GatherProps = Symbol("GatherProps");

/**
 * A type referring to a function that returns JSX and is marked that it shouldn't be wrapped in a ComputedRef
 * @see {@link jsx}
 */
export type JSXFunction = (() => JSX.Element) & { [DoNotCache]: true };
/**
 * Any value that can be coerced into (or is) a vue component
 */
export type CoercableComponent = string | DefineComponent | JSXFunction;
/**
 * Any value that can be passed into an HTML element's style attribute.
 * Note that Profectus uses its own StyleValue and CSSProperties that are extended,
 * in order to have additional properties added to them, such as variable CSS variables.
 */
export type StyleValue = string | CSSProperties | Array<string | CSSProperties>;

/** A type that refers to any vue component */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericComponent = DefineComponent<any, any, any>;

/** Utility type that is S, with any properties from T that aren't already present in S */
export type Replace<T, S> = S & Omit<T, keyof S>;

/**
 * Utility function for a function that returns an object of a given type,
 * with "this" bound to what the type will eventually be processed into.
 * Intended for making lazily evaluated objects.
 */
export type OptionsFunc<T, R = unknown, S = R> = (obj: R) => OptionsObject<T, R, S>;

export type OptionsObject<T, R = unknown, S = R> = T & Partial<R> & ThisType<T & S>;

let id = 0;
/**
 * Gets a unique ID to give to each feature, used for any sort of system that needs to identify
 * elements in the DOM rather than references to the feature itself. (For example, branches)
 * IDs are guaranteed unique, but _NOT_ persistent - they likely will change between updates.
 * @param prefix A string to prepend to the id to make it more readable in the inspector tools
 */
export function getUniqueID(prefix = "feature-"): string {
    return prefix + id++;
}

/** Enum for what the visibility of a feature or component should be */
export enum Visibility {
    /** The feature or component should be visible */
    Visible,
    /** The feature or component should not appear but still take up space */
    Hidden,
    /** The feature or component should not appear not take up space */
    None
}

export function isVisible(visibility: ProcessedComputable<Visibility | boolean>) {
    const currVisibility = unref(visibility);
    return currVisibility !== Visibility.None && currVisibility !== false;
}

export function isHidden(visibility: ProcessedComputable<Visibility | boolean>) {
    const currVisibility = unref(visibility);
    return currVisibility === Visibility.Hidden;
}

/**
 * Takes a function and marks it as JSX so it won't get auto-wrapped into a ComputedRef.
 * The function may also return empty string as empty JSX tags cause issues.
 */
export function jsx(func: () => JSX.Element | ""): JSXFunction {
    (func as Partial<JSXFunction>)[DoNotCache] = true;
    return func as JSXFunction;
}

/** Utility function to set a property on an object if and only if it doesn't already exist */
export function setDefault<T, K extends keyof T>(
    object: T,
    key: K,
    value: T[K]
): asserts object is Exclude<T, K> & Required<Pick<T, K>> {
    if (object[key] === undefined && value != undefined) {
        object[key] = value;
    }
}

/**
 * Traverses an object and returns all features of the given type(s)
 * @param obj The object to traverse
 * @param types The feature types that will be searched for
 */
export function findFeatures(obj: Record<string, unknown>, ...types: symbol[]): unknown[] {
    const objects: unknown[] = [];
    const handleObject = (obj: Record<string, unknown>) => {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value != null && typeof value === "object") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (types.includes((value as Record<string, any>).type)) {
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

/**
 * Traverses an object and returns all features that are _not_ any of the given types.
 * Features are any object with a "type" property that has a symbol value.
 * @param obj The object to traverse
 * @param types The feature types that will be skipped over
 */
export function excludeFeatures(obj: Record<string, unknown>, ...types: symbol[]): unknown[] {
    const objects: unknown[] = [];
    const handleObject = (obj: Record<string, unknown>) => {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value != null && typeof value === "object") {
                if (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    typeof (value as Record<string, any>).type == "symbol" &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    !types.includes((value as Record<string, any>).type)
                ) {
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
