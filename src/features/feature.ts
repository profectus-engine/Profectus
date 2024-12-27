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

/**
 * Utility function for determining if a visibility value is anything but Visibility.None.
 Booleans are allowed and false will be considered to be Visibility.None.
 * @param visibility The ref to either a visibility value or boolean
 * @returns True if the visibility is either true, Visibility.Visible, or Visibility.Hidden
 */
export function isVisible(visibility: MaybeRef<Visibility | boolean>) {
    const currVisibility = unref(visibility);
    return currVisibility !== Visibility.None && currVisibility !== false;
}

/**
 * Utility function for determining if a visibility value is Visibility.Hidden.
 Booleans are allowed but will never be considered to be Visible.Hidden.
 * @param visibility The ref to either a visibility value or boolean
 * @returns True if the visibility is Visibility.Hidden
 */
export function isHidden(visibility: MaybeRef<Visibility | boolean>) {
    const currVisibility = unref(visibility);
    return currVisibility === Visibility.Hidden;
}

/**
 * Utility function for narrowing something that may or may not be a specified type of feature.
 * Works off the principle that all features have a unique symbol to identify themselves with.
 * @param object The object to determine whether or not is of the specified type
 * @param type The symbol to look for in the object's "type" property
 * @returns Whether or not the object is the specified type
 */
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

/**
 * Utility function for taking a list of features and filtering them out, but keeping a reference to the first filtered out feature. Used for having a collapsible of the filtered out content, with the first filtered out item remaining outside the collapsible for easy reference.
 * @param features The list of features to search through
 * @param filter The filter to use to determine features that shouldn't be collapsible
 * @returns An object containing a ref to the first filtered _out_ feature, a render function for the collapsed content, and a ref for whether or not there is any collapsed content to show
 */
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
