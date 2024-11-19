import Bar from "features/bars/Bar.vue";
import type { OptionsFunc, Replace } from "features/feature";
import type { DecimalSource } from "util/bignum";
import { Direction } from "util/common";
import { ProcessedRefOrGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { CSSProperties, MaybeRef, MaybeRefOrGetter } from "vue";

/** A symbol used to identify {@link Bar} features. */
export const BarType = Symbol("Bar");

/**
 * An object that configures a {@link Bar}.
 */
export interface BarOptions extends VueFeatureOptions {
    /** The width of the bar. */
    width: MaybeRefOrGetter<number>;
    /** The height of the bar. */
    height: MaybeRefOrGetter<number>;
    /** The direction in which the bar progresses. */
    direction: MaybeRefOrGetter<Direction>;
    /** CSS to apply to the bar's border. */
    borderStyle?: MaybeRefOrGetter<CSSProperties>;
    /** CSS to apply to the bar's base. */
    baseStyle?: MaybeRefOrGetter<CSSProperties>;
    /** CSS to apply to the bar's text. */
    textStyle?: MaybeRefOrGetter<CSSProperties>;
    /** CSS to apply to the bar's fill. */
    fillStyle?: MaybeRefOrGetter<CSSProperties>;
    /** The progress value of the bar, from 0 to 1. */
    progress: MaybeRefOrGetter<DecimalSource>;
    /** The display to use for this bar. */
    display?: MaybeRefOrGetter<Renderable>;
}

/**
 * The properties that are added onto a processed {@link BarOptions} to create a {@link Bar}.
 */
export interface BaseBar extends VueFeature {
    /** A symbol that helps identify features of the same type. */
    type: typeof BarType;
}

/** An object that represents a feature that displays some sort of progress or completion or resource with a cap. */
export type Bar = Replace<
    Replace<BarOptions, BaseBar>,
    {
        width: ProcessedRefOrGetter<BarOptions["width"]>;
        height: ProcessedRefOrGetter<BarOptions["height"]>;
        direction: ProcessedRefOrGetter<BarOptions["direction"]>;
        borderStyle: ProcessedRefOrGetter<BarOptions["borderStyle"]>;
        baseStyle: ProcessedRefOrGetter<BarOptions["baseStyle"]>;
        textStyle: ProcessedRefOrGetter<BarOptions["textStyle"]>;
        fillStyle: ProcessedRefOrGetter<BarOptions["fillStyle"]>;
        progress: ProcessedRefOrGetter<BarOptions["progress"]>;
        display?: MaybeRef<Renderable>;
    }
>;

/**
 * Lazily creates a bar with the given options.
 * @param optionsFunc Bar options.
 */
export function createBar<T extends BarOptions>(optionsFunc: OptionsFunc<T, BaseBar, Bar>) {
    return createLazyProxy(feature => {
        const options = optionsFunc?.call(feature, feature as Bar);
        const {
            width,
            height,
            direction,
            borderStyle,
            baseStyle,
            textStyle,
            fillStyle,
            progress,
            display,
            ...props
        } = options;

        const bar = {
            type: BarType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof BarOptions>),
            ...vueFeatureMixin("bar", options, () => (
                <Bar
                    width={bar.width}
                    height={bar.height}
                    direction={bar.direction}
                    borderStyle={bar.borderStyle}
                    baseStyle={bar.baseStyle}
                    textStyle={bar.textStyle}
                    fillStyle={bar.fillStyle}
                    progress={bar.progress}
                    display={bar.display}
                />
            )),
            width: processGetter(width),
            height: processGetter(height),
            direction: processGetter(direction),
            borderStyle: processGetter(borderStyle),
            baseStyle: processGetter(baseStyle),
            textStyle: processGetter(textStyle),
            fillStyle: processGetter(fillStyle),
            progress: processGetter(progress),
            display: processGetter(display)
        } satisfies Bar;

        return bar;
    });
}
