import type { CoercableComponent, GenericComponent, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, setDefault } from "features/feature";
import { deletePersistent, Persistent, persistent } from "game/persistence";
import { Direction } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import type { VueFeature } from "util/vue";
import type { Ref } from "vue";
import { nextTick, unref } from "vue";
import TooltipComponent from "./Tooltip.vue";

declare module "@vue/runtime-dom" {
    interface CSSProperties {
        "--xoffset"?: string;
        "--yoffset"?: string;
    }
}

/**
 * An object that configures a {@link Tooltip}.
 */
export interface TooltipOptions {
    /** Whether or not this tooltip can be pinned, meaning it'll stay visible even when not hovered. */
    pinnable?: boolean;
    /** The text to display inside the tooltip. */
    display: Computable<CoercableComponent>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** The direction in which to display the tooltip */
    direction?: Computable<Direction>;
    /** The x offset of the tooltip, in px. */
    xoffset?: Computable<string>;
    /** The y offset of the tooltip, in px. */
    yoffset?: Computable<string>;
}

/**
 * The properties that are added onto a processed {@link TooltipOptions} to create an {@link Tooltip}.
 */
export interface BaseTooltip {
    pinned?: Ref<boolean>;
}

/** An object that represents a tooltip that appears when hovering over an element. */
export type Tooltip<T extends TooltipOptions> = Replace<
    T & BaseTooltip,
    {
        pinnable: T["pinnable"] extends undefined ? false : T["pinnable"];
        pinned: T["pinnable"] extends true ? Ref<boolean> : undefined;
        display: GetComputableType<T["display"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        direction: GetComputableTypeWithDefault<T["direction"], Direction.Up>;
        xoffset: GetComputableType<T["xoffset"]>;
        yoffset: GetComputableType<T["yoffset"]>;
    }
>;

/** A type that matches any valid {@link Tooltip} object. */
export type GenericTooltip = Replace<
    Tooltip<TooltipOptions>,
    {
        pinnable: boolean;
        pinned: Ref<boolean> | undefined;
        direction: ProcessedComputable<Direction>;
    }
>;

/**
 * Creates a tooltip on the given element with the given options.
 * @param element The renderable feature to display the tooltip on.
 * @param options Tooltip options.
 */
export function addTooltip<T extends TooltipOptions>(
    element: VueFeature,
    options: T & ThisType<Tooltip<T>> & Partial<BaseTooltip>
): Tooltip<T> {
    processComputable(options as T, "display");
    processComputable(options as T, "classes");
    processComputable(options as T, "style");
    processComputable(options as T, "direction");
    setDefault(options, "direction", Direction.Up);
    processComputable(options as T, "xoffset");
    processComputable(options as T, "yoffset");

    if (options.pinnable) {
        options.pinned = persistent<boolean>(false, false);
    }

    nextTick(() => {
        if (options.pinnable) {
            if ("pinned" in element) {
                console.error(
                    "Cannot add pinnable tooltip to element that already has a property called 'pinned'"
                );
                options.pinnable = false;
                deletePersistent(options.pinned as Persistent<boolean>);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (element as any).pinned = options.pinned;
            }
        }
        const elementComponent = element[Component];
        element[Component] = TooltipComponent as GenericComponent;
        const elementGatherProps = element[GatherProps].bind(element);
        element[GatherProps] = function gatherTooltipProps(this: GenericTooltip) {
            const { display, classes, style, direction, xoffset, yoffset, pinned } = this;
            return {
                element: {
                    [Component]: elementComponent,
                    [GatherProps]: elementGatherProps
                },
                display,
                classes,
                style: unref(style),
                direction,
                xoffset,
                yoffset,
                pinned
            };
        }.bind(options as GenericTooltip);
    });

    return options as unknown as Tooltip<T>;
}
