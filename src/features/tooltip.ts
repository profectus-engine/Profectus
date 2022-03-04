import { CoercableComponent } from "features/feature";
import { ProcessedComputable } from "util/computed";

declare module "@vue/runtime-dom" {
    interface CSSProperties {
        "--xoffset"?: string;
        "--yoffset"?: string;
    }
}

export interface Tooltip {
    display: ProcessedComputable<CoercableComponent>;
    top?: ProcessedComputable<boolean>;
    left?: ProcessedComputable<boolean>;
    right?: ProcessedComputable<boolean>;
    bottom?: ProcessedComputable<boolean>;
    xoffset?: ProcessedComputable<string>;
    yoffset?: ProcessedComputable<string>;
    force?: ProcessedComputable<boolean>;
}

export function gatherTooltipProps(tooltip: Tooltip) {
    const { display, top, left, right, bottom, xoffset, yoffset, force } = tooltip;
    return { display, top, left, right, bottom, xoffset, yoffset, force };
}
