import Decimal from "util/bignum";
import { Renderable, renderCol, VueFeature } from "util/vue";
import { computed, isRef, MaybeRef, Ref, unref } from "vue";

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
export function findFeatures(obj: object, ...types: symbol[]): unknown[] {
    const objects: unknown[] = [];
    const handleObject = (obj: object) => {
        Object.keys(obj).forEach(key => {
            const value: unknown = obj[key as keyof typeof obj];
            if (
                value != null &&
                typeof value === "object" &&
                (value as Record<string, unknown>).__v_isVNode !== true
            ) {
                if (types.includes((value as Record<string, unknown>).type as symbol)) {
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
    collapsedContent: () => Renderable;
    hasCollapsedContent: Ref<boolean>;
} {
    const filteredFeatures = computed(() =>
        features.filter(feature => isVisible(feature.visibility ?? true) && filter(feature))
    );
    return {
        firstFeature: computed(() => filteredFeatures.value[0]),
        collapsedContent: () => renderCol(...filteredFeatures.value.slice(1)),
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
            if (
                value != null &&
                typeof value === "object" &&
                (value as Record<string, unknown>).__v_isVNode !== true
            ) {
                const type = (value as Record<string, unknown>).type;
                if (typeof type === "symbol" && !types.includes(type)) {
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
