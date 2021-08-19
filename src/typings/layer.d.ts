import { LayerType } from "@/game/layers";
import Decimal, { DecimalSource } from "@/util/bignum";
import { CoercableComponent } from "./component";
import { Achievement } from "./features/achievement";
import { Bar } from "./features/bar";
import { Board, RawBoard } from "./features/board";
import { Buyable } from "./features/buyable";
import { Challenge } from "./features/challenge";
import { Clickable } from "./features/clickable";
import {
    Feature,
    Features,
    GridFeatures,
    RawFeature,
    RawFeatures,
    RawGridFeatures
} from "./features/feature";
import { Grid } from "./features/grid";
import { Hotkey } from "./features/hotkey";
import { Infobox } from "./features/infobox";
import { Milestone } from "./features/milestone";
import { MicrotabFamily, RawMicrotabFamily, Subtab } from "./features/subtab";
import { Upgrade } from "./features/upgrade";
import { State } from "./state";

export interface RawLayer extends RawFeature<Layer> {
    id: string;
    componentStyles?: RawComponentStyles;
    achievements?: RawGridFeatures<NonNullable<Layer["achievements"]>, Achievement>;
    bars?: RawFeatures<NonNullable<Layer["bars"]>, Bar>;
    buyables?: RawGridFeatures<NonNullable<Layer["buyables"]>, Buyable>;
    challenges?: RawGridFeatures<NonNullable<Layer["challenges"]>, Challenge>;
    clickables?: RawGridFeatures<NonNullable<Layer["clickables"]>, Clickable>;
    grids?: RawFeatures<NonNullable<Layer["grids"]>, Grid>;
    boards?: RawFeatures<NonNullable<Layer["boards"]>, Board, RawBoard>;
    hotkeys?: RawFeature<Hotkey>[];
    infoboxes?: RawFeatures<NonNullable<Layer["infoboxes"]>, Infoboxe>;
    milestones?: RawFeatures<NonNullable<Layer["milestones"]>, Milestone>;
    subtabs?: Record<string, RawFeature<Subtab>>;
    microtabs?: Record<string, RawMicrotabFamily>;
    upgrades?: RawGridFeatures<NonNullable<Layer["upgrades"]>, Upgrade>;
    startData?: () => Record<string, State>;
}

export interface Layer extends Feature {
    id: string;
    name?: string;
    type: LayerType;
    row?: number | string;
    position?: number;
    deactivated?: boolean;
    baseResource?: string;
    baseAmount?: DecimalSource;
    requires?: DecimalSource;
    base?: DecimalSource;
    exponent?: DecimalSource;
    effect?: State;
    effectDisplay?: CoercableComponent;
    resetDescription?: string;
    component?: CoercableComponent;
    midsection?: CoercableComponent;
    style?: Partial<CSSStyleDeclaration>;
    nodeStyle?: Partial<CSSStyleDeclaration>;
    display?: CoercableComponent;
    shown: boolean;
    layerShown: boolean | "ghost";
    color: string;
    glowColor: string;
    minWidth: number;
    displayRow: number | string;
    symbol: string;
    canClick?: boolean;
    trueGlowColor: string;
    resetGain: Decimal;
    gainMult?: DecimalSource;
    directMult?: DecimalSource;
    gainExp?: DecimalSource;
    softcap?: DecimalSource;
    softcapPower?: DecimalSource;
    passiveGeneration?: DecimalSource | boolean;
    autoReset?: boolean;
    resetsNothing?: boolean;
    autoUpgrade?: boolean;
    resource: string;
    showNextAt?: boolean;
    nextAt: Decimal;
    nextAtMax: Decimal;
    canReset: boolean;
    prestigeButtonDisplay?: CoercableComponent;
    notify: boolean;
    tooltip?: CoercableComponent;
    tooltipLocked?: CoercableComponent;
    resetNotify: boolean;
    componentStyles?: ComponentStyles;
    increaseUnlockOrder?: Array<string>;
    achievements?: GridFeatures<Achievement>;
    bars?: Features<Bar>;
    buyables?: GridFeatures<Buyable> & {
        respec?: () => void;
        reset: () => void;
        respecButtonDisplay?: CoercableComponent;
        respecWarningDisplay?: CoercableComponent;
        showRespecButton?: boolean;
    };
    challenges?: GridFeatures<Challenge>;
    activeChallenge?: Challenge | undefined;
    clickables?: GridFeatures<Clickable> & {
        masterButtonClick?: () => void;
        masterButtonDisplay?: CoercableComponent;
        showMasterButton?: boolean;
    };
    grids?: Features<Grid>;
    boards?: Features<Board>;
    hotkeys?: Hotkey[];
    infoboxes?: Features<Infobox>;
    milestones?: Features<Milestone>;
    subtabs?: Record<string, Subtab>;
    activeSubtab?: Subtab | undefined;
    microtabs?: Record<string, MicrotabFamily>;
    upgrades?: GridFeatures<Upgrade>;
    startData?: () => Record<string, State>;
    click?: () => void;
    automate?: () => void;
    reset: (force?: boolean) => void;
    onReset: (resettingLayer: string) => void;
    onPrestige?: (resetGain: Decimal) => void;
    hardReset: (keep?: Array<string>) => void;
    update?: (diff: DecimalSource) => void;
}

export type RawComponentStyles = Partial<Computed<ComponentStyles>>;
export interface ComponentStyles {
    achievement?: Partial<CSSStyleDeclaration>;
    bar?: Partial<CSSStyleDeclaration>;
    buyable?: Partial<CSSStyleDeclaration>;
    clickable?: Partial<CSSStyleDeclaration>;
    challenge?: Partial<CSSStyleDeclaration>;
    "grid-cell"?: Partial<CSSStyleDeclaration>;
    infobox?: Partial<CSSStyleDeclaration>;
    "infobox-title"?: Partial<CSSStyleDeclaration>;
    "infobox-body"?: Partial<CSSStyleDeclaration>;
    "main-display"?: Partial<CSSStyleDeclaration>;
    "master-button"?: Partial<CSSStyleDeclaration>;
    milestone?: Partial<CSSStyleDeclaration>;
    "prestige-button"?: Partial<CSSStyleDeclaration>;
    "respec-button"?: Partial<CSSStyleDeclaration>;
    upgrade?: Partial<CSSStyleDeclaration>;
    board?: Partial<CSSStyleDeclaration>;
    "tab-button"?: Partial<CSSStyleDeclaration>;
}
