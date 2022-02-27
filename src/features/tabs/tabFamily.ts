import {
    CoercableComponent,
    Component,
    GatherProps,
    getUniqueID,
    makePersistent,
    Persistent,
    PersistentState,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "@/features/feature";
import TabButtonComponent from "@/features/tabs/TabButton.vue";
import TabFamilyComponent from "@/features/tabs/TabFamily.vue";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createLazyProxy } from "@/util/proxies";
import { computed, Ref, unref } from "vue";
import { GenericTab } from "./tab";

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

interface BaseTabButton {
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

export function createTabButton<T extends TabButtonOptions>(
    options: T & ThisType<TabButton<T>>
): TabButton<T> {
    const tabButton: T & Partial<BaseTabButton> = options;
    tabButton.type = TabButtonType;
    tabButton[Component] = TabButtonComponent;

    processComputable(tabButton as T, "visibility");
    setDefault(tabButton, "visibility", Visibility.Visible);
    processComputable(tabButton as T, "tab");
    processComputable(tabButton as T, "display");
    processComputable(tabButton as T, "classes");
    processComputable(tabButton as T, "style");
    processComputable(tabButton as T, "glowColor");

    return tabButton as unknown as TabButton<T>;
}

export interface TabFamilyOptions {
    visibility?: Computable<Visibility>;
    tabs: Computable<Record<string, GenericTabButton>>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
}

interface BaseTabFamily extends Persistent<string> {
    id: string;
    activeTab: Ref<GenericTab | CoercableComponent | null>;
    selected: Ref<string>;
    type: typeof TabFamilyType;
    [Component]: typeof TabFamilyComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type TabFamily<T extends TabFamilyOptions> = Replace<
    T & BaseTabFamily,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        tabs: GetComputableType<T["tabs"]>;
    }
>;

export type GenericTabFamily = Replace<
    TabFamily<TabFamilyOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createTabFamily<T extends TabFamilyOptions>(
    optionsFunc: () => T & ThisType<TabFamily<T>>
): TabFamily<T> {
    return createLazyProxy(() => {
        const tabFamily: T & Partial<BaseTabFamily> = optionsFunc();

        if (Object.keys(tabFamily.tabs).length === 0) {
            console.warn("Cannot create tab family with 0 tabs", tabFamily);
            throw "Cannot create tab family with 0 tabs";
        }

        tabFamily.id = getUniqueID("tabFamily-");
        tabFamily.type = TabFamilyType;
        tabFamily[Component] = TabFamilyComponent;

        makePersistent<string>(tabFamily, Object.keys(tabFamily.tabs)[0]);
        tabFamily.selected = tabFamily[PersistentState];
        tabFamily.activeTab = computed(() => {
            const tabs = unref((tabFamily as GenericTabFamily).tabs);
            if (
                tabFamily[PersistentState].value in tabs &&
                unref(tabs[(tabFamily as GenericTabFamily)[PersistentState].value].visibility) ===
                    Visibility.Visible
            ) {
                return unref(tabs[(tabFamily as GenericTabFamily)[PersistentState].value].tab);
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

        tabFamily[GatherProps] = function (this: GenericTabFamily) {
            const { visibility, activeTab, selected, tabs, style, classes } = this;
            return { visibility, activeTab, selected, tabs, style, classes };
        };

        return tabFamily as unknown as TabFamily<T>;
    });
}
