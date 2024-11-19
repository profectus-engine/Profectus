import { isVisible, type OptionsFunc, type Replace } from "features/feature";
import { deletePersistent, persistent } from "game/persistence";
import { Direction } from "util/common";
import { ProcessedRefOrGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, vueFeatureMixin, type VueFeature, type VueFeatureOptions } from "util/vue";
import { MaybeRef, MaybeRefOrGetter, type Ref } from "vue";
import Tooltip from "wrappers/tooltips/Tooltip.vue";

declare module "@vue/runtime-dom" {
    interface CSSProperties {
        "--xoffset"?: string;
        "--yoffset"?: string;
    }
}

/**
 * An object that configures a {@link Tooltip}.
 */
export interface TooltipOptions extends VueFeatureOptions {
    /** Whether or not this tooltip can be pinned, meaning it'll stay visible even when not hovered. */
    pinnable?: boolean;
    /** The text to display inside the tooltip. */
    display: MaybeRefOrGetter<Renderable>;
    /** The direction in which to display the tooltip */
    direction?: MaybeRefOrGetter<Direction>;
    /** The x offset of the tooltip, in px. */
    xoffset?: MaybeRefOrGetter<string>;
    /** The y offset of the tooltip, in px. */
    yoffset?: MaybeRefOrGetter<string>;
}

/**
 * The properties that are added onto a processed {@link TooltipOptions} to create an {@link Tooltip}.
 */
export interface BaseTooltip extends VueFeature {
    pinned?: Ref<boolean>;
}

/** An object that represents a tooltip that appears when hovering over an element. */
export type Tooltip = Replace<
    Replace<TooltipOptions, BaseTooltip>,
    {
        pinnable: boolean;
        pinned?: Ref<boolean>;
        display: MaybeRef<Renderable>;
        direction: MaybeRef<Direction>;
        xoffset?: ProcessedRefOrGetter<TooltipOptions["xoffset"]>;
        yoffset?: ProcessedRefOrGetter<TooltipOptions["yoffset"]>;
    }
>;

/**
 * Creates a tooltip on the given element with the given options.
 * @param element The renderable feature to display the tooltip on.
 * @param options Tooltip options.
 */
export function addTooltip<T extends TooltipOptions>(
    element: VueFeature,
    optionsFunc: OptionsFunc<T, BaseTooltip, Tooltip>
) {
    const pinned = persistent<boolean>(false, false);
    const tooltip = createLazyProxy(feature => {
        const options = optionsFunc.call(feature, feature as Tooltip);
        const { pinnable, display, direction, xoffset, yoffset, ...props } = options;

        if (pinnable === false) {
            deletePersistent(pinned);
        }

        const tooltip = {
            ...(props as Omit<typeof props, keyof VueFeature | keyof TooltipOptions>),
            ...vueFeatureMixin("tooltip", options),
            pinnable: pinnable ?? true,
            pinned: pinnable === false ? undefined : pinned,
            display: processGetter(display),
            direction: processGetter(direction ?? Direction.Up),
            xoffset: processGetter(xoffset),
            yoffset: processGetter(yoffset)
        } satisfies Tooltip;

        return tooltip;
    });

    element.wrappers.push(el =>
        isVisible(tooltip.visibility ?? true) ? (
            <Tooltip
                pinned={tooltip.pinned}
                display={tooltip.display}
                classes={tooltip.classes}
                style={tooltip.style}
                direction={tooltip.direction}
                xoffset={tooltip.xoffset}
                yoffset={tooltip.yoffset}
            >
                {el}
            </Tooltip>
        ) : (
            <>{el}</>
        )
    );

    return tooltip;
}
