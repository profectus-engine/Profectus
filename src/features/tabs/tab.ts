import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, getUniqueID } from "features/feature";
import TabComponent from "features/tabs/Tab.vue";
import type { Computable, GetComputableType } from "util/computed";
import { createLazyProxy } from "util/proxies";

/** A symbol used to identify {@link Tab} features. */
export const TabType = Symbol("Tab");

/**
 * An object that configures a {@link Tab}.
 */
export interface TabOptions {
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** The display to use for this tab. */
    display: Computable<CoercableComponent>;
}

/**
 * The properties that are added onto a processed {@link TabOptions} to create an {@link Tab}.
 */
export interface BaseTab {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** A symbol that helps identify features of the same type. */
    type: typeof TabType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/**
 * An object representing a tab of content in a tabbed interface.
 * @see {@link TabFamily}
 */
export type Tab<T extends TabOptions> = Replace<
    T & BaseTab,
    {
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
    }
>;

/** A type that matches any valid {@link Tab} object. */
export type GenericTab = Tab<TabOptions>;

/**
 * Lazily creates a tab with the given options.
 * @param optionsFunc Tab options.
 */
export function createTab<T extends TabOptions>(
    optionsFunc: OptionsFunc<T, BaseTab, GenericTab>
): Tab<T> {
    return createLazyProxy(feature => {
        const tab = optionsFunc.call(feature, feature);
        tab.id = getUniqueID("tab-");
        tab.type = TabType;
        tab[Component] = TabComponent as GenericComponent;

        tab[GatherProps] = function (this: GenericTab) {
            const { display } = this;
            return { display };
        };

        return tab as unknown as Tab<T>;
    });
}
