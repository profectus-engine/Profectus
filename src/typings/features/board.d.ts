import { State } from "../state";
import { Feature, RawFeature } from "./feature";

export interface BoardNode {
    id: string;
    position: {
        x: number;
        y: number;
    };
    type: string;
    data?: State;
}

export interface CardOption {
    text: string;
    selected: (node: BoardNode) => void;
}

export interface Board extends Feature {
    startNodes: () => Omit<BoardNode, "id">[];
    style?: Partial<CSSStyleDeclaration>;
    height: string;
    width: string;
    types: Record<string, NodeType>;
}

export type RawBoard = Omit<RawFeature<Board>, "types" | "startNodes"> & {
    startNodes: () => Omit<BoardNode, "id">[];
    types: Record<string, RawFeature<NodeType>>;
};

export interface NodeType extends Feature {
    tooltip?: string | ((node: BoardNode) => string);
    title: string | ((node: BoardNode) => string);
    size: number | ((node: BoardNode) => number);
    draggable: boolean | ((node: BoardNode) => boolean);
    canAccept: boolean | ((node: BoardNode, otherNode: BoardNode) => boolean);
    progress?: number | ((node: BoardNode) => number);
    progressDisplay: ProgressDisplay | ((node: BoardNode) => ProgressDisplay);
    progressColor: string | ((node: BoardNode) => string);
    fillColor?: string | ((node: BoardNode) => string);
    outlineColor?: string | ((node: BoardNode) => string);
    titleColor?: string | ((node: BoardNode) => string);
    onClick: (node: BoardNode) => void;
    onDrop: (node: BoardNode, otherNode: BoardNode) => void;
    nodes: BoardNode[];
}
