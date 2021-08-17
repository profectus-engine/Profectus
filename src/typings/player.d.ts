import { Themes } from "@/data/themes";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal from "@/util/bignum";
import { MilestoneDisplay } from "./features/milestone";
import { State } from "./state";

export interface ModSaveData {
    active?: string;
    saves?: string[];
}

export interface PlayerData {
    id: string;
    devSpeed?: DecimalSource;
    points: Decimal;
    oomps: Decimal;
    oompsMag: number;
    name: string;
    tabs: Array<string>;
    time: number;
    autosave: boolean;
    offlineProd: boolean;
    offlineTime: Decimal | null;
    timePlayed: Decimal;
    keepGoing: boolean;
    lastTenTicks: Array<number>;
    showTPS: boolean;
    msDisplay: MilestoneDisplay;
    hideChallenges: boolean;
    theme: Themes;
    subtabs: {
        [index: string]: {
            mainTabs?: string;
            [index: string]: string;
        };
    };
    minimized: Record<string, boolean>;
    modID: string;
    modVersion: string;
    hasNaN: boolean;
    NaNPath?: Array<string>;
    NaNReceiver?: Record<string, unknown> | null;
    importing: ImportingStatus;
    saveToImport: string;
    saveToExport: string;
    layers: Record<string, LayerSaveData>;
    [index: string]: unknown;
}

export interface LayerSaveData {
    points: Decimal;
    unlocked: boolean;
    unlockOrder?: number;
    forceTooltip?: boolean;
    resetTime: Decimal;
    upgrades: Array<string | number>;
    achievements: Array<string | number>;
    milestones: Array<string | number>;
    infoboxes: Record<string | number, boolean>;
    buyables: Record<string | number, Decimal>;
    clickables: Record<string | number, State>;
    challenges: Record<string | number, Decimal>;
    grids: Record<string | number, Record<string, number, State>>;
    confirmRespecBuyables: boolean;
    [index: string]: unknown;
}
