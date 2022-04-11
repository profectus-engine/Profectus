import {
    CoercableComponent,
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    Replace,
    StyleValue
} from "features/feature";
import TabComponent from "features/tabs/Tab.vue";
import { Computable, GetComputableType } from "util/computed";
import { createLazyProxy } from "util/proxies";

export const TabType = Symbol("Tab");

export interface TabOptions {
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    display: Computable<CoercableComponent>;
}

export interface BaseTab {
    id: string;
    type: typeof TabType;
    [Component]: typeof TabComponent;
    [GatherProps]: () => Record<string, unknown>;
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

export function createTab<T extends TabOptions>(
    optionsFunc: OptionsFunc<T, Tab<T>, BaseTab>
): Tab<T> {
    return createLazyProxy(() => {
        const tab = optionsFunc();
        tab.id = getUniqueID("tab-");
        tab.type = TabType;
        tab[Component] = TabComponent;

        tab[GatherProps] = function (this: GenericTab) {
            const { display } = this;
            return { display };
        };

        return tab as unknown as Tab<T>;
    });
}
