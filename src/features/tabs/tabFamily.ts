import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, getUniqueID, setDefault, Visibility } from "features/feature";
import TabButtonComponent from "features/tabs/TabButton.vue";
import TabFamilyComponent from "features/tabs/TabFamily.vue";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, unref } from "vue";
import type { GenericTab } from "./tab";

export const TabButtonType = Symbol("TabButton");
export const TabFamilyType = Symbol("TabFamily");

export interface TabButtonOptions {
    visibility?: Computable<Visibility>;
    tab: Computable<GenericTab | CoercableComponent>;
    display: Computable<CoercableComponent>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    glowColor?: Computable<string>;
}

export interface BaseTabButton {
    type: typeof TabButtonType;
    [Component]: typeof TabButtonComponent;
}

export type TabButton<T extends TabButtonOptions> = Replace<
    T & BaseTabButton,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        tab: GetComputableType<T["tab"]>;
        display: GetComputableType<T["display"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        glowColor: GetComputableType<T["glowColor"]>;
    }
>;

export type GenericTabButton = Replace<
    TabButton<TabButtonOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export interface TabFamilyOptions {
    visibility?: Computable<Visibility>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    buttonContainerClasses?: Computable<Record<string, boolean>>;
    buttonContainerStyle?: Computable<StyleValue>;
}

export interface BaseTabFamily {
    id: string;
    tabs: Record<string, TabButtonOptions>;
    activeTab: Ref<GenericTab | CoercableComponent | null>;
    selected: Persistent<string>;
    type: typeof TabFamilyType;
    [Component]: typeof TabFamilyComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type TabFamily<T extends TabFamilyOptions> = Replace<
    T & BaseTabFamily,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        tabs: Record<string, GenericTabButton>;
    }
>;

export type GenericTabFamily = Replace<
    TabFamily<TabFamilyOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createTabFamily<T extends TabFamilyOptions>(
    tabs: Record<string, () => TabButtonOptions>,
    optionsFunc?: OptionsFunc<T, BaseTabFamily, GenericTabFamily>
): TabFamily<T> {
    if (Object.keys(tabs).length === 0) {
        console.warn("Cannot create tab family with 0 tabs");
        throw "Cannot create tab family with 0 tabs";
    }

    const selected = persistent(Object.keys(tabs)[0]);
    return createLazyProxy(() => {
        const tabFamily = optionsFunc?.() ?? ({} as ReturnType<NonNullable<typeof optionsFunc>>);

        tabFamily.id = getUniqueID("tabFamily-");
        tabFamily.type = TabFamilyType;
        tabFamily[Component] = TabFamilyComponent;

        tabFamily.tabs = Object.keys(tabs).reduce<Record<string, GenericTabButton>>(
            (parsedTabs, tab) => {
                const tabButton: TabButtonOptions & Partial<BaseTabButton> = tabs[tab]();
                tabButton.type = TabButtonType;
                tabButton[Component] = TabButtonComponent;

                processComputable(tabButton as TabButtonOptions, "visibility");
                setDefault(tabButton, "visibility", Visibility.Visible);
                processComputable(tabButton as TabButtonOptions, "tab");
                processComputable(tabButton as TabButtonOptions, "display");
                processComputable(tabButton as TabButtonOptions, "classes");
                processComputable(tabButton as TabButtonOptions, "style");
                processComputable(tabButton as TabButtonOptions, "glowColor");
                parsedTabs[tab] = tabButton as GenericTabButton;
                return parsedTabs;
            },
            {}
        );
        tabFamily.selected = selected;
        tabFamily.activeTab = computed(() => {
            const tabs = unref(processedTabFamily.tabs);
            if (
                selected.value in tabs &&
                unref(tabs[selected.value].visibility) === Visibility.Visible
            ) {
                return unref(tabs[selected.value].tab);
            }
            const firstTab = Object.values(tabs).find(
                tab => unref(tab.visibility) === Visibility.Visible
            );
            if (firstTab) {
                return unref(firstTab.tab);
            }
            return null;
        });

        processComputable(tabFamily as T, "visibility");
        setDefault(tabFamily, "visibility", Visibility.Visible);
        processComputable(tabFamily as T, "classes");
        processComputable(tabFamily as T, "style");
        processComputable(tabFamily as T, "buttonContainerClasses");
        processComputable(tabFamily as T, "buttonContainerStyle");

        tabFamily[GatherProps] = function (this: GenericTabFamily) {
            const {
                visibility,
                activeTab,
                selected,
                tabs,
                style,
                classes,
                buttonContainerClasses,
                buttonContainerStyle
            } = this;
            return {
                visibility,
                activeTab,
                selected,
                tabs,
                style: unref(style),
                classes,
                buttonContainerClasses,
                buttonContainerStyle
            };
        };

        // This is necessary because board.types is different from T and TabFamily
        const processedTabFamily = tabFamily as unknown as TabFamily<T>;
        return processedTabFamily;
    });
}
