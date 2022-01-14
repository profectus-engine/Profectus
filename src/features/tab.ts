import TabComponent from "@/components/features/Tab.vue";
import { Computable, GetComputableType } from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { CoercableComponent, Component, getUniqueID, Replace, StyleValue } from "./feature";

export const TabType = Symbol("Tab");

export interface TabOptions {
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    display: Computable<CoercableComponent>;
}

interface BaseTab {
    id: string;
    type: typeof TabType;
    [Component]: typeof TabComponent;
}

export type Tab<T extends TabOptions> = Replace<
    T & BaseTab,
    {
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericTab = Tab<TabOptions>;

export function createTab<T extends TabOptions>(options: T & ThisType<Tab<T>>): Tab<T> {
    const tab: T & Partial<BaseTab> = options;
    tab.id = getUniqueID("tab-");
    tab.type = TabType;
    tab[Component] = TabComponent;

    const proxy = createProxy((tab as unknown) as Tab<T>);
    return proxy;
}
