import { Feature } from "./feature";

export interface Milestone extends Feature {
    earned: boolean;
    shown: boolean;
    done: boolean;
    style?: Partial<CSSStyleDeclaration>;
    requirementDisplay?: CoercableComponent;
    effectDisplay?: CoercableComponent;
    optionsDisplay?: CoercableComponent;
    onComplete?: () => void;
}
