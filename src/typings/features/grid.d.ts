import { State } from "@/typings/state";
import { Feature } from "./feature";

export interface Grid extends Feature {
    maxRows: number;
    rows: number;
    cols: number;
    getData?: (cell: string | number) => State;
    setData?: (cell: string | number, data: State) => void;
    getUnlocked: boolean | ((cell: string | number) => boolean);
    getCanClick: boolean | ((cell: string | number) => boolean);
    getStartData: State | ((cell: string | number) => State);
    getStyle?:
        | Partial<CSSStyleDeclaration>
        | ((cell: string | number) => Partial<CSSStyleDeclaration> | undefined);
    click?: (cell: string | number) => void;
    hold?: (cell: string | number) => void;
    getTitle?: string | ((cell: string | number) => string);
    getDisplay: string | ((cell: string | number) => string);
}

export interface GridCell extends Feature {
    data: State;
    dataSet: (data: State) => void;
    effect?: State;
    unlocked: boolean;
    canClick: boolean;
    style?: Partial<CSSStyleDeclaration>;
    click?: () => void;
    hold?: () => void;
    title?: string;
    display: string;
}
