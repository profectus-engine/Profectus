import InfoboxComponent from "features/infoboxes/Infobox.vue";
import {
    CoercableComponent,
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Ref, unref } from "vue";
import { Persistent, PersistentState, persistent } from "game/persistence";

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

export interface BaseInfobox extends Persistent<boolean> {
    id: string;
    collapsed: Ref<boolean>;
    type: typeof InfoboxType;
    [Component]: typeof InfoboxComponent;
    [GatherProps]: () => Record<string, unknown>;
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
    optionsFunc: OptionsFunc<T, Infobox<T>, BaseInfobox>
): Infobox<T> {
    return createLazyProxy(persistent => {
        const infobox = Object.assign(persistent, optionsFunc());
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

        infobox[GatherProps] = function (this: GenericInfobox) {
            const {
                visibility,
                display,
                title,
                color,
                collapsed,
                style,
                titleStyle,
                bodyStyle,
                classes,
                id
            } = this;
            return {
                visibility,
                display,
                title,
                color,
                collapsed,
                style: unref(style),
                titleStyle,
                bodyStyle,
                classes,
                id
            };
        };

        return infobox as unknown as Infobox<T>;
    }, persistent<boolean>(false));
}
