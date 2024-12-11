import Bar from "features/bars/Bar.vue";
import type { DecimalSource } from "util/bignum";
import { Direction } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
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
    display?: MaybeGetter<Renderable>;
}

/** An object that represents a feature that displays some sort of progress or completion or resource with a cap. */
export interface Bar extends VueFeature {
    /** The width of the bar. */
    width: MaybeRef<number>;
    /** The height of the bar. */
    height: MaybeRef<number>;
    /** The direction in which the bar progresses. */
    direction: MaybeRef<Direction>;
    /** CSS to apply to the bar's border. */
    borderStyle?: MaybeRef<CSSProperties>;
    /** CSS to apply to the bar's base. */
    baseStyle?: MaybeRef<CSSProperties>;
    /** CSS to apply to the bar's text. */
    textStyle?: MaybeRef<CSSProperties>;
    /** CSS to apply to the bar's fill. */
    fillStyle?: MaybeRef<CSSProperties>;
    /** The progress value of the bar, from 0 to 1. */
    progress: MaybeRef<DecimalSource>;
    /** The display to use for this bar. */
    display?: MaybeGetter<Renderable>;
    /** A symbol that helps identify features of the same type. */
    type: typeof BarType;
}

/**
 * Lazily creates a bar with the given options.
 * @param optionsFunc Bar options.
 */
export function createBar<T extends BarOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc?.();
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
            display
        } satisfies Bar;

        return bar;
    });
}
