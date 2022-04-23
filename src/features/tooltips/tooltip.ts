import TooltipComponent from "./Tooltip.vue";
import {
    CoercableComponent,
    Component,
    GatherProps,
    Replace,
    setDefault,
    StyleValue
} from "features/feature";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { VueFeature } from "util/vue";
import { readonly, ref, Ref } from "vue";
import { persistent } from "game/persistence";

declare module "@vue/runtime-dom" {
    interface CSSProperties {
        "--xoffset"?: string;
        "--yoffset"?: string;
    }
}

export enum TooltipDirection {
    UP,
    LEFT,
    RIGHT,
    DOWN
}

export interface TooltipOptions {
    pinnable?: boolean;
    display: Computable<CoercableComponent>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    direction?: Computable<TooltipDirection>;
    xoffset?: Computable<string>;
    yoffset?: Computable<string>;
}

export interface BaseTooltip {
    pinned?: Ref<boolean>;
}

export type Tooltip<T extends TooltipOptions> = Replace<
    T & BaseTooltip,
    {
        pinnable: T["pinnable"] extends unknown ? true : T["pinnable"];
        display: GetComputableType<T["display"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        direction: GetComputableTypeWithDefault<T["direction"], TooltipDirection.UP>;
        xoffset: GetComputableType<T["xoffset"]>;
        yoffset: GetComputableType<T["yoffset"]>;
    }
>;

export type GenericTooltip = Replace<
    Tooltip<TooltipOptions>,
    {
        pinnable: boolean;
        direction: ProcessedComputable<TooltipDirection>;
    }
>;

export function addTooltip<T extends TooltipOptions>(
    element: VueFeature,
    options: T & ThisType<Tooltip<T>> & Partial<BaseTooltip>
): Tooltip<T> {
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

    processComputable(options as T, "display");
    processComputable(options as T, "classes");
    processComputable(options as T, "style");
    processComputable(options as T, "direction");
    setDefault(options, "direction", TooltipDirection.UP);
    processComputable(options as T, "xoffset");
    processComputable(options as T, "yoffset");

    const elementComponent = element[Component];
    element[Component] = TooltipComponent;
    const elementGratherProps = element[GatherProps].bind(element);
    element[GatherProps] = function gatherTooltipProps(this: GenericTooltip) {
        const { display, classes, style, direction, xoffset, yoffset, pinned } = this;
        return {
            element: {
                [Component]: elementComponent,
                [GatherProps]: elementGratherProps
            },
            display,
            classes,
            style,
            direction,
            xoffset,
            yoffset,
            pinned
        };
    }.bind(options as GenericTooltip);

    return options as unknown as Tooltip<T>;
}
