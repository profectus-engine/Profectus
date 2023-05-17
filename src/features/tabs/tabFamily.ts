import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import {
    Component,
    GatherProps,
    getUniqueID,
    isVisible,
    setDefault,
    Visibility
} from "features/feature";
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

/** A symbol used to identify {@link TabButton} features. */
export const TabButtonType = Symbol("TabButton");
/** A symbol used to identify {@link TabFamily} features. */
export const TabFamilyType = Symbol("TabFamily");

/**
 * An object that configures a {@link TabButton}.
 */
export interface TabButtonOptions {
    /** Whether this tab button should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The tab to display when this button is clicked. */
    tab: Computable<GenericTab | CoercableComponent>;
    /** The label on this button. */
    display: Computable<CoercableComponent>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** The color of the glow effect to display when this button is active. */
    glowColor?: Computable<string>;
}

/**
 * The properties that are added onto a processed {@link TabButtonOptions} to create an {@link TabButton}.
 */
export interface BaseTabButton {
    /** A symbol that helps identify features of the same type. */
    type: typeof TabButtonType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
}

/**
 * An object that represents a button that can be clicked to change tabs in a tabbed interface.
 * @see {@link TabFamily}
 */
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

/** A type that matches any valid {@link TabButton} object. */
export type GenericTabButton = Replace<
    TabButton<TabButtonOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * An object that configures a {@link TabFamily}.
 */
export interface TabFamilyOptions {
    /** Whether this tab button should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** A dictionary of CSS classes to apply to the list of buttons for changing tabs. */
    buttonContainerClasses?: Computable<Record<string, boolean>>;
    /** CSS to apply to the list of buttons for changing tabs. */
    buttonContainerStyle?: Computable<StyleValue>;
}

/**
 * The properties that are added onto a processed {@link TabFamilyOptions} to create an {@link TabFamily}.
 */
export interface BaseTabFamily {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** All the tabs within this family. */
    tabs: Record<string, TabButtonOptions>;
    /** The currently active tab, if any. */
    activeTab: Ref<GenericTab | CoercableComponent | null>;
    /** The name of the tab that is currently active. */
    selected: Persistent<string>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TabFamilyType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/**
 * An object that represents a tabbed interface.
 * @see {@link TabFamily}
 */
export type TabFamily<T extends TabFamilyOptions> = Replace<
    T & BaseTabFamily,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        tabs: Record<string, GenericTabButton>;
    }
>;

/** A type that matches any valid {@link TabFamily} object. */
export type GenericTabFamily = Replace<
    TabFamily<TabFamilyOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * Lazily creates a tab family with the given options.
 * @param optionsFunc Tab family options.
 */
export function createTabFamily<T extends TabFamilyOptions>(
    tabs: Record<string, () => TabButtonOptions>,
    optionsFunc?: OptionsFunc<T, BaseTabFamily, GenericTabFamily>
): TabFamily<T> {
    if (Object.keys(tabs).length === 0) {
        console.error("Cannot create tab family with 0 tabs");
    }

    const selected = persistent(Object.keys(tabs)[0], false);
    return createLazyProxy(feature => {
        const tabFamily =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);

        tabFamily.id = getUniqueID("tabFamily-");
        tabFamily.type = TabFamilyType;
        tabFamily[Component] = TabFamilyComponent as GenericComponent;

        tabFamily.tabs = Object.keys(tabs).reduce<Record<string, GenericTabButton>>(
            (parsedTabs, tab) => {
                const tabButton: TabButtonOptions & Partial<BaseTabButton> = tabs[tab]();
                tabButton.type = TabButtonType;
                tabButton[Component] = TabButtonComponent as GenericComponent;

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
            if (selected.value in tabs && isVisible(tabs[selected.value].visibility)) {
                return unref(tabs[selected.value].tab);
            }
            const firstTab = Object.values(tabs).find(tab => isVisible(tab.visibility));
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
