import BarComponent from "features/bars/Bar.vue";
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
import { DecimalSource } from "util/bignum";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref } from "vue";

export const BarType = Symbol("Bar");

export enum Direction {
    Up = "Up",
    Down = "Down",
    Left = "Left",
    Right = "Right",
    Default = "Up"
}

export interface BarOptions {
    visibility?: Computable<Visibility>;
    width: Computable<number>;
    height: Computable<number>;
    direction: Computable<Direction>;
    style?: Computable<StyleValue>;
    classes?: Computable<Record<string, boolean>>;
    borderStyle?: Computable<StyleValue>;
    baseStyle?: Computable<StyleValue>;
    textStyle?: Computable<StyleValue>;
    fillStyle?: Computable<StyleValue>;
    progress: Computable<DecimalSource>;
    display?: Computable<CoercableComponent>;
    mark?: Computable<boolean | string>;
}

export interface BaseBar {
    id: string;
    type: typeof BarType;
    [Component]: typeof BarComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Bar<T extends BarOptions> = Replace<
    T & BaseBar,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        width: GetComputableType<T["width"]>;
        height: GetComputableType<T["height"]>;
        direction: GetComputableType<T["direction"]>;
        style: GetComputableType<T["style"]>;
        classes: GetComputableType<T["classes"]>;
        borderStyle: GetComputableType<T["borderStyle"]>;
        baseStyle: GetComputableType<T["baseStyle"]>;
        textStyle: GetComputableType<T["textStyle"]>;
        fillStyle: GetComputableType<T["fillStyle"]>;
        progress: GetComputableType<T["progress"]>;
        display: GetComputableType<T["display"]>;
        mark: GetComputableType<T["mark"]>;
    }
>;

export type GenericBar = Replace<
    Bar<BarOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createBar<T extends BarOptions>(
    optionsFunc: OptionsFunc<T, Bar<T>, BaseBar>
): Bar<T> {
    return createLazyProxy(() => {
        const bar = optionsFunc();
        bar.id = getUniqueID("bar-");
        bar.type = BarType;
        bar[Component] = BarComponent;

        processComputable(bar as T, "visibility");
        setDefault(bar, "visibility", Visibility.Visible);
        processComputable(bar as T, "width");
        processComputable(bar as T, "height");
        processComputable(bar as T, "direction");
        processComputable(bar as T, "style");
        processComputable(bar as T, "classes");
        processComputable(bar as T, "borderStyle");
        processComputable(bar as T, "baseStyle");
        processComputable(bar as T, "textStyle");
        processComputable(bar as T, "fillStyle");
        processComputable(bar as T, "progress");
        processComputable(bar as T, "display");
        processComputable(bar as T, "mark");

        bar[GatherProps] = function (this: GenericBar) {
            const {
                progress,
                width,
                height,
                direction,
                display,
                visibility,
                style,
                classes,
                borderStyle,
                textStyle,
                baseStyle,
                fillStyle,
                mark,
                id
            } = this;
            return {
                progress,
                width,
                height,
                direction,
                display,
                visibility,
                style: unref(style),
                classes,
                borderStyle,
                textStyle,
                baseStyle,
                fillStyle,
                mark,
                id
            };
        };

        return bar as unknown as Bar<T>;
    });
}
