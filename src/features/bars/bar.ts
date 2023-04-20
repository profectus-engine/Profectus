import BarComponent from "features/bars/Bar.vue";
import { GenericDecorator } from "features/decorators/common";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, Visibility, getUniqueID, setDefault } from "features/feature";
import type { DecimalSource } from "util/bignum";
import { Direction } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref } from "vue";

/** A symbol used to identify {@link Bar} features. */
export const BarType = Symbol("Bar");

/**
 * An object that configures a {@link Bar}.
 */
export interface BarOptions {
    /** Whether this bar should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The width of the bar. */
    width: Computable<number>;
    /** The height of the bar. */
    height: Computable<number>;
    /** The direction in which the bar progresses. */
    direction: Computable<Direction>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to the bar's border. */
    borderStyle?: Computable<StyleValue>;
    /** CSS to apply to the bar's base. */
    baseStyle?: Computable<StyleValue>;
    /** CSS to apply to the bar's text. */
    textStyle?: Computable<StyleValue>;
    /** CSS to apply to the bar's fill. */
    fillStyle?: Computable<StyleValue>;
    /** The progress value of the bar, from 0 to 1. */
    progress: Computable<DecimalSource>;
    /** The display to use for this bar. */
    display?: Computable<CoercableComponent>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
}

/**
 * The properties that are added onto a processed {@link BarOptions} to create a {@link Bar}.
 */
export interface BaseBar {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** A symbol that helps identify features of the same type. */
    type: typeof BarType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that displays some sort of progress or completion or resource with a cap. */
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

/** A type that matches any valid {@link Bar} object. */
export type GenericBar = Replace<
    Bar<BarOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * Lazily creates a bar with the given options.
 * @param optionsFunc Bar options.
 */
export function createBar<T extends BarOptions>(
    optionsFunc: OptionsFunc<T, BaseBar, GenericBar>,
    ...decorators: GenericDecorator[]
): Bar<T> {
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const bar = optionsFunc.call(feature, feature);
        bar.id = getUniqueID("bar-");
        bar.type = BarType;
        bar[Component] = BarComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(bar);
        }

        Object.assign(bar, decoratedData);

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

        for (const decorator of decorators) {
            decorator.postConstruct?.(bar);
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(bar)),
            {}
        );
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
                id,
                ...decoratedProps
            };
        };

        return bar as unknown as Bar<T>;
    });
}
