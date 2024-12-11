import { isVisible } from "features/feature";
import { Tab } from "features/tabs/tab";
import TabButton from "features/tabs/TabButton.vue";
import TabFamily from "features/tabs/TabFamily.vue";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { MaybeGetter, processGetter } from "util/computed";
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
    tab: Tab | MaybeGetter<Renderable>;
    /** The label on this button. */
    display: MaybeGetter<Renderable>;
    /** The color of the glow effect to display when this button is active. */
    glowColor?: MaybeRefOrGetter<string>;
}

/**
 * An object that represents a button that can be clicked to change tabs in a tabbed interface.
 * @see {@link TabFamily}
 */
export interface TabButton extends VueFeature {
    /** The tab to display when this button is clicked. */
    tab: Tab | MaybeGetter<Renderable>;
    /** The label on this button. */
    display: MaybeGetter<Renderable>;
    /** The color of the glow effect to display when this button is active. */
    glowColor?: MaybeRef<string>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TabButtonType;
}

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
 * An object that represents a tabbed interface.
 * @see {@link TabFamily}
 */
export interface TabFamily extends VueFeature {
    /** A dictionary of CSS classes to apply to the list of buttons for changing tabs. */
    buttonContainerClasses?: MaybeRef<Record<string, boolean>>;
    /** CSS to apply to the list of buttons for changing tabs. */
    buttonContainerStyle?: MaybeRef<CSSProperties>;
    /** All the tabs within this family. */
    tabs: Record<string, TabButton>;
    /** The currently active tab, if any. */
    activeTab: Ref<Tab | MaybeGetter<Renderable> | null>;
    /** The name of the tab that is currently active. */
    selected: Persistent<string>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TabFamilyType;
}

/**
 * Lazily creates a tab family with the given options.
 * @param optionsFunc Tab family options.
 */
export function createTabFamily<T extends TabFamilyOptions>(
    tabs: Record<string, () => TabButtonOptions>,
    optionsFunc?: () => T
) {
    if (Object.keys(tabs).length === 0) {
        console.error("Cannot create tab family with 0 tabs");
    }

    const selected = persistent(Object.keys(tabs)[0], false);
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const { buttonContainerClasses, buttonContainerStyle, ...props } = options;

        const tabFamily = {
            type: TabFamilyType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof TabFamilyOptions>),
            ...vueFeatureMixin("tabFamily", options, () => (
                <TabFamily
                    activeTab={tabFamily.activeTab}
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
                    ...vueFeatureMixin("tabButton", options, () => (
                        <TabButton
                            display={tabButton.display}
                            glowColor={tabButton.glowColor}
                            active={unref(tabButton.tab) === unref(tabFamily.activeTab)}
                            onSelectTab={() => (tabFamily.selected.value = tab)}
                        />
                    )),
                    tab: buttonTab,
                    glowColor: processGetter(glowColor),
                    display
                } satisfies TabButton;

                parsedTabs[tab] = tabButton;
                return parsedTabs;
            }, {}),
            buttonContainerClasses: processGetter(buttonContainerClasses),
            buttonContainerStyle: processGetter(buttonContainerStyle),
            selected,
            activeTab: computed((): Tab | MaybeGetter<Renderable> | null => {
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
