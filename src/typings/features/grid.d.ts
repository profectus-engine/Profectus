import { State } from "@/typings/state";
import { Feature } from "./feature";

export interface Grid extends Feature {
    maxRows: number;
    rows: number;
    cols: number;
    getState?: (cell: string | number) => State;
    setState?: (cell: string | number, state: State) => void;
    getUnlocked: boolean | ((cell: string | number) => boolean);
    getCanClick: boolean | ((cell: string | number) => boolean);
    getStartState: State | ((cell: string | number) => State);
    getStyle?:
        | Partial<CSSStyleDeclaration>
        | ((cell: string | number) => Partial<CSSStyleDeclaration> | undefined);
    click?: (cell: string | number) => void;
    hold?: (cell: string | number) => void;
    getTitle?: string | ((cell: string | number) => string);
    getDisplay: string | ((cell: string | number) => string);
}

export interface GridCell extends Feature {
    state: State;
    stateSet: (state: State) => void;
    effect?: State;
    unlocked: boolean;
    canClick: boolean;
    style?: Partial<CSSStyleDeclaration>;
    click?: () => void;
    hold?: () => void;
    title?: string;
    display: string;
}
