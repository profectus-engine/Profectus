import { isVisible } from "features/feature";
import { deletePersistent, persistent } from "game/persistence";
import { Direction } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy, runAfterEvaluation } from "util/proxies";
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
    display: MaybeGetter<Renderable>;
    /** The direction in which to display the tooltip */
    direction?: MaybeRefOrGetter<Direction>;
    /** The x offset of the tooltip, in px. */
    xoffset?: MaybeRefOrGetter<string>;
    /** The y offset of the tooltip, in px. */
    yoffset?: MaybeRefOrGetter<string>;
}

/** An object that represents a tooltip that appears when hovering over an element. */
export interface Tooltip extends VueFeature {
    /** Whether or not this tooltip can be pinned, meaning it'll stay visible even when not hovered. */
    pinnable?: boolean;
    /** The text to display inside the tooltip. */
    display: MaybeGetter<Renderable>;
    /** The direction in which to display the tooltip */
    direction?: MaybeRef<Direction>;
    /** The x offset of the tooltip, in px. */
    xoffset?: MaybeRef<string>;
    /** The y offset of the tooltip, in px. */
    yoffset?: MaybeRef<string>;
    /** Whether or not this tooltip is currently pinned. Undefined if {@link pinnable} is false. */
    pinned?: Ref<boolean>;
}

/**
 * Creates a tooltip on the given element with the given options.
 * @param element The renderable feature to display the tooltip on.
 * @param optionsFunc Tooltip options.
 */
export function addTooltip(
    element: VueFeature,
    optionsFunc: () => TooltipOptions
): asserts element is VueFeature & { tooltip: Tooltip } {
    const pinned = persistent<boolean>(false, false);
    const tooltip = createLazyProxy(() => {
        const options = optionsFunc();
        const { pinnable, display, direction, xoffset, yoffset, ...props } = options;

        if (pinnable === false) {
            deletePersistent(pinned);
        }

        const tooltip = {
            ...(props as Omit<typeof props, keyof VueFeature | keyof TooltipOptions>),
            ...vueFeatureMixin("tooltip", options),
            pinnable: pinnable ?? true,
            pinned: pinnable === false ? undefined : pinned,
            display,
            direction: processGetter(direction ?? Direction.Up),
            xoffset: processGetter(xoffset),
            yoffset: processGetter(yoffset)
        } satisfies Tooltip;

        return tooltip;
    });

    runAfterEvaluation(element, el => {
        tooltip.id; // Ensure tooltip gets evaluated
        (el as VueFeature & { tooltip: Tooltip }).tooltip = tooltip;
        el.wrappers.push(el =>
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
    });
}
