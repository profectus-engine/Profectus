import { CoercableComponent } from "@/typings/component";
import { State } from "@/typings/state";
import { Feature } from "./feature";

export interface Clickable extends Feature {
    state: State;
    stateSet: (state: State) => void;
    effect?: State;
    canClick: boolean;
    click?: () => void;
    hold?: () => void;
    style?: Partial<CSSStyleDeclaration>;
    title?: CoercableComponent;
    display: CoercableComponent;
}
