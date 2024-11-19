import Decimal from "util/bignum";
import { Renderable, renderCol, VueFeature } from "util/vue";
import { computed, isRef, MaybeRef, Ref, unref } from "vue";

/** Utility type that is S, with any properties from T that aren't already present in S */
export type Replace<T, S> = S & Omit<T, keyof S>;

/**
 * Utility function for a function that returns an object of a given type,
 * with "this" bound to what the type will eventually be processed into.
 * Intended for making lazily evaluated objects.
 */
export type OptionsFunc<T, R = unknown, S = R> = (obj: S) => OptionsObject<T, R, S>;

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

export function isVisible(visibility: MaybeRef<Visibility | boolean>) {
    const currVisibility = unref(visibility);
    return currVisibility !== Visibility.None && currVisibility !== false;
}

export function isHidden(visibility: MaybeRef<Visibility | boolean>) {
    const currVisibility = unref(visibility);
    return currVisibility === Visibility.Hidden;
}

export function isType<T extends symbol>(object: unknown, type: T): object is { type: T } {
    return object != null && typeof object === "object" && "type" in object && object.type === type;
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

export function getFirstFeature<T extends VueFeature>(
    features: T[],
    filter: (feature: T) => boolean
): {
    firstFeature: Ref<T | undefined>;
    collapsedContent: MaybeRef<Renderable>;
    hasCollapsedContent: Ref<boolean>;
} {
    const filteredFeatures = computed(() =>
        features.filter(feature => isVisible(feature.visibility ?? true) && filter(feature))
    );
    return {
        firstFeature: computed(() => filteredFeatures.value[0]),
        collapsedContent: computed(() => renderCol(...filteredFeatures.value.slice(1))),
        hasCollapsedContent: computed(() => filteredFeatures.value.length > 1)
    };
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
                    typeof (value as Record<string, any>).type === "symbol" &&
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
