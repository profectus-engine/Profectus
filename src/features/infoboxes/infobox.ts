import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, getUniqueID, setDefault, Visibility } from "features/feature";
import InfoboxComponent from "features/infoboxes/Infobox.vue";
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
import { unref } from "vue";

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

export interface BaseInfobox {
    id: string;
    collapsed: Persistent<boolean>;
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
    optionsFunc: OptionsFunc<T, BaseInfobox, GenericInfobox>
): Infobox<T> {
    const collapsed = persistent<boolean>(false);
    return createLazyProxy(() => {
        const infobox = optionsFunc();
        infobox.id = getUniqueID("infobox-");
        infobox.type = InfoboxType;
        infobox[Component] = InfoboxComponent;

        infobox.collapsed = collapsed;

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
    });
}
