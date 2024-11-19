import type { OptionsFunc, Replace } from "features/feature";
import { isVisible } from "features/feature";
import { Tab } from "features/tabs/tab";
import TabButton from "features/tabs/TabButton.vue";
import TabFamily from "features/tabs/TabFamily.vue";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { ProcessedRefOrGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import type { CSSProperties, MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, unref } from "vue";

/** A symbol used to identify {@link TabButton} features. */
export const TabButtonType = Symbol("TabButton");
/** A symbol used to identify {@link TabFamily} features. */
export const TabFamilyType = Symbol("TabFamily");

/**
 * An object that configures a {@link TabButton}.
 */
export interface TabButtonOptions extends VueFeatureOptions {
    /** The tab to display when this button is clicked. */
    tab: Tab | MaybeRefOrGetter<Renderable>;
    /** The label on this button. */
    display: MaybeRefOrGetter<Renderable>;
    /** The color of the glow effect to display when this button is active. */
    glowColor?: MaybeRefOrGetter<string>;
}

/**
 * The properties that are added onto a processed {@link TabButtonOptions} to create an {@link TabButton}.
 */
export interface BaseTabButton extends VueFeature {
    /** A symbol that helps identify features of the same type. */
    type: typeof TabButtonType;
}

/**
 * An object that represents a button that can be clicked to change tabs in a tabbed interface.
 * @see {@link TabFamily}
 */
export type TabButton = Replace<
    Replace<TabButtonOptions, BaseTabButton>,
    {
        tab: Tab | MaybeRef<Renderable>;
        display: ProcessedRefOrGetter<TabButtonOptions["display"]>;
        glowColor: ProcessedRefOrGetter<TabButtonOptions["glowColor"]>;
    }
>;

/**
 * An object that configures a {@link TabFamily}.
 */
export interface TabFamilyOptions extends VueFeatureOptions {
    /** A dictionary of CSS classes to apply to the list of buttons for changing tabs. */
    buttonContainerClasses?: MaybeRefOrGetter<Record<string, boolean>>;
    /** CSS to apply to the list of buttons for changing tabs. */
    buttonContainerStyle?: MaybeRefOrGetter<CSSProperties>;
}

/**
 * The properties that are added onto a processed {@link TabFamilyOptions} to create an {@link TabFamily}.
 */
export interface BaseTabFamily extends VueFeature {
    /** All the tabs within this family. */
    tabs: Record<string, TabButtonOptions>;
    /** The currently active tab, if any. */
    activeTab: Ref<Tab | MaybeRef<Renderable> | null>;
    /** The name of the tab that is currently active. */
    selected: Persistent<string>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TabFamilyType;
}

/**
 * An object that represents a tabbed interface.
 * @see {@link TabFamily}
 */
export type TabFamily = Replace<
    Replace<TabFamilyOptions, BaseTabFamily>,
    {
        tabs: Record<string, TabButton>;
    }
>;

/**
 * Lazily creates a tab family with the given options.
 * @param optionsFunc Tab family options.
 */
export function createTabFamily<T extends TabFamilyOptions>(
    tabs: Record<string, () => TabButtonOptions>,
    optionsFunc?: OptionsFunc<T, BaseTabFamily, TabFamily>
) {
    if (Object.keys(tabs).length === 0) {
        console.error("Cannot create tab family with 0 tabs");
    }

    const selected = persistent(Object.keys(tabs)[0], false);
    return createLazyProxy(feature => {
        const options = optionsFunc?.call(feature, feature as TabFamily) ?? ({} as T);
        const { buttonContainerClasses, buttonContainerStyle, ...props } = options;

        const tabFamily = {
            type: TabFamilyType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof TabFamilyOptions>),
            ...vueFeatureMixin("tabFamily", options, () => (
                <TabFamily
                    activeTab={tabFamily.activeTab}
                    selected={tabFamily.selected}
                    tabs={tabFamily.tabs}
                    buttonContainerClasses={tabFamily.buttonContainerClasses}
                    buttonContainerStyle={tabFamily.buttonContainerStyle}
                />
            )),
            tabs: Object.keys(tabs).reduce<Record<string, TabButton>>((parsedTabs, tab) => {
                const options = tabs[tab]();
                const { tab: buttonTab, glowColor, display, ...props } = options;

                const tabButton = {
                    type: TabButtonType,
                    ...(props as Omit<typeof props, keyof VueFeature | keyof TabButtonOptions>),
                    ...vueFeatureMixin("tabButton", options),
                    tab: processGetter(buttonTab),
                    glowColor: processGetter(glowColor),
                    display: processGetter(display)
                } satisfies TabButton;

                parsedTabs[tab] = tabButton;
                return parsedTabs;
            }, {}),
            buttonContainerClasses: processGetter(buttonContainerClasses),
            buttonContainerStyle: processGetter(buttonContainerStyle),
            selected,
            activeTab: computed((): Tab | MaybeRef<Renderable> | null => {
                if (
                    selected.value in tabFamily.tabs &&
                    isVisible(tabFamily.tabs[selected.value].visibility ?? true)
                ) {
                    return unref(tabFamily.tabs[selected.value].tab);
                }
                const firstTab = Object.values(tabFamily.tabs).find(tab =>
                    isVisible(tab.visibility ?? true)
                );
                if (firstTab != null) {
                    return unref(firstTab.tab);
                }
                return null;
            })
        } satisfies TabFamily;

        return tabFamily;
    });
}
