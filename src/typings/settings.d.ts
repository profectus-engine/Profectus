import { Themes } from "@/data/themes";
import { MilestoneDisplay } from "@/game/enums";

// This is the global save data, persists between individual saves
export interface Settings {
    active: string;
    saves: string[];
    showTPS: boolean;
    msDisplay: MilestoneDisplay;
    hideChallenges: boolean;
    theme: Themes;
    [index: string]: unknown;
}
