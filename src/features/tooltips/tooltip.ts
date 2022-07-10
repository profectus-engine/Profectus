import type { CoercableComponent, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, setDefault } from "features/feature";
import { persistent } from "game/persistence";
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

export interface TooltipOptions {
    pinnable?: boolean;
    display: Computable<CoercableComponent>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    direction?: Computable<Direction>;
    xoffset?: Computable<string>;
    yoffset?: Computable<string>;
}

export interface BaseTooltip {
    pinned?: Ref<boolean>;
}

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

export type GenericTooltip = Replace<
    Tooltip<TooltipOptions>,
    {
        pinnable: boolean;
        pinned: Ref<boolean> | undefined;
        direction: ProcessedComputable<Direction>;
    }
>;

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
        if ("pinned" in element) {
            console.error(
                "Cannot add pinnable tooltip to element that already has a property called 'pinned'"
            );
            options.pinnable = false;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element as any).pinned = options.pinned = persistent<boolean>(false);
        }
    }

    nextTick(() => {
        const elementComponent = element[Component];
        element[Component] = TooltipComponent;
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
