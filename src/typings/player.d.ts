import Decimal, { DecimalSource } from "@/util/bignum";
import { BoardData } from "./features/board";
import { State } from "./state";

export interface PlayerData {
    id: string;
    devSpeed?: DecimalSource;
    points: Decimal;
    name: string;
    tabs: Array<string>;
    time: number;
    autosave: boolean;
    offlineProd: boolean;
    offlineTime: Decimal | null;
    timePlayed: Decimal;
    keepGoing: boolean;
    subtabs: {
        [index: string]: {
            mainTabs?: string;
            [index: string]: string;
        };
    };
    minimized: Record<string, boolean>;
    modID: string;
    modVersion: string;
    justLoaded: boolean;
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
    infoboxes: Record<string, boolean>;
    buyables: Record<string, Decimal>;
    clickables: Record<string, State>;
    challenges: Record<string, Decimal>;
    grids: Record<string, Record<string, State>>;
    boards: Record<string, BoardData>;
    confirmRespecBuyables: boolean;
    [index: string]: unknown;
}
