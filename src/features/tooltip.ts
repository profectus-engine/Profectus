import { CoercableComponent } from "@/features/feature";
import { ProcessedComputable } from "@/util/computed";

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
