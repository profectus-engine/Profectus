import TabButtonComponent from "@/components/features/TabButton.vue";
import TabFamilyComponent from "@/components/features/TabFamily.vue";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { computed, Ref, unref } from "vue";
import {
    CoercableComponent,
    Component,
    getUniqueID,
    makePersistent,
    Persistent,
    PersistentState,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "./feature";
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

    const proxy = createProxy(tabButton as unknown as TabButton<T>);
    return proxy;
}

export interface TabFamilyOptions {
    tabs: Computable<Record<string, GenericTabButton>>;
}

interface BaseTabFamily extends Persistent<string> {
    id: string;
    activeTab: Ref<GenericTab | CoercableComponent | null>;
    type: typeof TabFamilyType;
    [Component]: typeof TabFamilyComponent;
}

export type TabFamily<T extends TabFamilyOptions> = Replace<
    T & BaseTabFamily,
    {
        tabs: GetComputableType<T["tabs"]>;
    }
>;

export type GenericTabFamily = TabFamily<TabFamilyOptions>;

export function createTabFamily<T extends TabFamilyOptions>(
    options: T & ThisType<TabFamily<T>>
): TabFamily<T> {
    if (Object.keys(options.tabs).length === 0) {
        console.warn("Cannot create tab family with 0 tabs", options);
        throw "Cannot create tab family with 0 tabs";
    }

    const tabFamily: T & Partial<BaseTabFamily> = options;
    tabFamily.id = getUniqueID("tabFamily-");
    tabFamily.type = TabFamilyType;
    tabFamily[Component] = TabFamilyComponent;

    makePersistent<string>(tabFamily, Object.keys(options.tabs)[0]);
    tabFamily.activeTab = computed(() => {
        const tabs = unref(proxy.tabs);
        if (
            proxy[PersistentState].value in tabs &&
            unref(tabs[proxy[PersistentState].value].visibility) === Visibility.Visible
        ) {
            return unref(tabs[proxy[PersistentState].value].tab);
        }
        const firstTab = Object.values(tabs).find(
            tab => unref(tab.visibility) === Visibility.Visible
        );
        if (firstTab) {
            return unref(firstTab.tab);
        }
        return null;
    });

    const proxy = createProxy(tabFamily as unknown as TabFamily<T>);
    return proxy;
}
