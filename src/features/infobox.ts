import InfoboxComponent from "@/components/features/Infobox.vue";
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
} from "@/features/feature";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { Ref } from "vue";

export const InfoboxType = Symbol("Infobox");

export interface InfoboxOptions {
    visibility?: Computable<Visibility>;
    color?: Computable<string>;
    style?: Computable<StyleValue>;
    titleStyle?: Computable<StyleValue>;
    bodyStyle?: Computable<StyleValue>;
    classes?: Computable<Record<string, boolean>>;
    title: Computable<CoercableComponent>;
    display: Computable<CoercableComponent>;
}

interface BaseInfobox extends Persistent<boolean> {
    id: string;
    collapsed: Ref<boolean>;
    type: typeof InfoboxType;
    [Component]: typeof InfoboxComponent;
}

export type Infobox<T extends InfoboxOptions> = Replace<
    T & BaseInfobox,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        color: GetComputableType<T["color"]>;
        style: GetComputableType<T["style"]>;
        titleStyle: GetComputableType<T["titleStyle"]>;
        bodyStyle: GetComputableType<T["bodyStyle"]>;
        classes: GetComputableType<T["classes"]>;
        title: GetComputableType<T["title"]>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericInfobox = Replace<
    Infobox<InfoboxOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createInfobox<T extends InfoboxOptions>(
    options: T & ThisType<Infobox<T>>
): Infobox<T> {
    const infobox: T & Partial<BaseInfobox> = options;
    makePersistent<boolean>(infobox, false);
    infobox.id = getUniqueID("infobox-");
    infobox.type = InfoboxType;
    infobox[Component] = InfoboxComponent;

    infobox.collapsed = infobox[PersistentState];

    processComputable(infobox as T, "visibility");
    setDefault(infobox, "visibility", Visibility.Visible);
    processComputable(infobox as T, "color");
    processComputable(infobox as T, "style");
    processComputable(infobox as T, "titleStyle");
    processComputable(infobox as T, "bodyStyle");
    processComputable(infobox as T, "classes");
    processComputable(infobox as T, "title");
    processComputable(infobox as T, "display");

    const proxy = createProxy(infobox as unknown as Infobox<T>);
    return proxy;
}
