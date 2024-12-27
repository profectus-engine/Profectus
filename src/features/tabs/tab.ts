import { MaybeGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";

/** A symbol used to identify {@link Tab} features. */
export const TabType = Symbol("Tab");

/**
 * An object that configures a {@link Tab}.
 */
export interface TabOptions extends VueFeatureOptions {
    /** The display to use for this tab. */
    display: MaybeGetter<Renderable>;
}

/**
 * An object representing a tab of content in a tabbed interface.
 * @see {@link features/tabs/tabFamily.TabFamily}
 */
export interface Tab extends VueFeature {
    /** The display to use for this tab. */
    display: MaybeGetter<Renderable>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TabType;
}

/**
 * Lazily creates a tab with the given options.
 * @param optionsFunc Tab options.
 */
export function createTab<T extends TabOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const { display, ...props } = options;

        const tab = {
            type: TabType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof TabOptions>),
            ...vueFeatureMixin("tab", options, display),
            display
        } satisfies Tab;

        return tab;
    });
}
