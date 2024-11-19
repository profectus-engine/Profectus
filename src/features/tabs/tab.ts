import type { OptionsFunc, Replace } from "features/feature";
import { ProcessedRefOrGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { render, Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { MaybeRefOrGetter } from "vue";
import { JSX } from "vue/jsx-runtime";

/** A symbol used to identify {@link Tab} features. */
export const TabType = Symbol("Tab");

/**
 * An object that configures a {@link Tab}.
 */
export interface TabOptions extends VueFeatureOptions {
    /** The display to use for this tab. */
    display: MaybeRefOrGetter<Renderable>;
}

/**
 * The properties that are added onto a processed {@link TabOptions} to create an {@link Tab}.
 */
export interface BaseTab extends VueFeature {
    /** A symbol that helps identify features of the same type. */
    type: typeof TabType;
}

/**
 * An object representing a tab of content in a tabbed interface.
 * @see {@link TabFamily}
 */
export type Tab = Replace<
    Replace<TabOptions, BaseTab>,
    {
        display: ProcessedRefOrGetter<TabOptions["display"]>;
    }
>;

/**
 * Lazily creates a tab with the given options.
 * @param optionsFunc Tab options.
 */
export function createTab<T extends TabOptions>(optionsFunc: OptionsFunc<T, BaseTab, Tab>) {
    return createLazyProxy(feature => {
        const options = optionsFunc?.call(feature, feature as Tab) ?? ({} as T);
        const { display, ...props } = options;

        const tab = {
            type: TabType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof TabOptions>),
            ...vueFeatureMixin("tab", options, (): JSX.Element => render(tab.display)),
            display: processGetter(display)
        } satisfies Tab;

        return tab;
    });
}
