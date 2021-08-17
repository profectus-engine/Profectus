import { CoercableComponent } from "@/component";
import { State } from "../state";
import { Feature } from "./feature";

export interface Achievement extends Feature {
    earned: boolean;
    onComplete?: () => void;
    effect?: State;
    display?: CoercableComponent;
    name?: CoercableComponent;
    style?: Partial<CSSStyleDeclaration>;
    image?: string;
    doneTooltip?: CoercableComponent;
    goalTooltip?: CoercableComponent;
    tooltip?: CoercableComponent;
}
