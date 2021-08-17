import { CoercableComponent } from "@/typings/component";
import { State } from "@/typings/state";
import { DecimalSource } from "@/util/bignum";
import { Feature } from "./feature";

export interface Challenge extends Feature {
    shown: boolean;
    completed: boolean;
    completions: DecimalSource;
    maxed: boolean;
    active: boolean;
    effect?: State;
    canStart: boolean;
    canComplete: boolean;
    completionLimit: DecimalSource;
    mark: boolean | string;
    goal: DecimalSource;
    currencyInternalName?: string;
    currencyDisplayName?: string;
    currencyLocation?: { [key: string]: DecimalSource };
    currencyLayer?: string;
    titleDisplay?: CoercableComponent;
    name?: CoercableComponent;
    fullDisplay?: CoercableComponent;
    style?: Partial<CSSStyleDeclaration>;
    challengeDescription: CoercableComponent;
    goalDescription?: CoercableComponent;
    rewardDescription: CoercableComponent;
    rewardDisplay?: CoercableComponent;
    toggle: () => void;
    onComplete?: () => void;
    onExit?: () => void;
    onEnter?: () => void;
}
