import { Shape } from "@/game/enums";
import { DecimalSource } from "@/lib/break_eternity";
import { State } from "../state";
import { Feature, RawFeature } from "./feature";

export interface BoardNode {
    id: number;
    position: {
        x: number;
        y: number;
    };
    type: string;
    data?: State;
    pinned?: boolean;
}

export interface BoardData {
    nodes: BoardNode[];
    selectedNode: number | null;
    selectedAction: string | null;
}

export interface Board extends Feature {
    startNodes: () => Omit<BoardNode, "id">[];
    style?: Partial<CSSStyleDeclaration>;
    height: string;
    width: string;
    types: Record<string, NodeType>;
    nodes: BoardNode[];
    selectedNode: BoardNode | null;
    selectedAction: BoardNodeAction | null;
    links: BoardNodeLink[] | null;
}

export type RawBoard = Omit<RawFeature<Board>, "types" | "startNodes"> & {
    startNodes: () => Omit<BoardNode, "id">[];
    types: Record<string, RawFeature<NodeType>>;
};

export interface NodeType extends Feature {
    title: string | ((node: BoardNode) => string);
    label?: NodeLabel | null | ((node: BoardNode) => NodeLabel | null);
    size: number | string | ((node: BoardNode) => number | string);
    draggable: boolean | ((node: BoardNode) => boolean);
    shape: Shape | ((node: BoardNode) => Shape);
    canAccept: boolean | ((node: BoardNode, otherNode: BoardNode) => boolean);
    progress?: number | ((node: BoardNode) => number);
    progressDisplay: ProgressDisplay | ((node: BoardNode) => ProgressDisplay);
    progressColor: string | ((node: BoardNode) => string);
    fillColor?: string | ((node: BoardNode) => string);
    outlineColor?: string | ((node: BoardNode) => string);
    titleColor?: string | ((node: BoardNode) => string);
    actions?: BoardNodeAction[] | ((node: BoardNode) => BoardNodeAction[]);
    actionDistance: number | ((node: BoardNode) => number);
    onClick?: (node: BoardNode) => void;
    onDrop?: (node: BoardNode, otherNode: BoardNode) => void;
    update?: (node: BoardNode, diff: DecimalSource) => void;
    nodes: BoardNode[];
}

export interface BoardNodeAction {
    id: string;
    icon: string | ((node: BoardNode) => string);
    fillColor?: string | ((node: BoardNode) => string);
    tooltip: string | ((node: BoardNode) => string);
    onClick: (node: BoardNode) => boolean | undefined;
    links?: BoardNodeLink[] | ((node: BoardNode) => BoardNodeLink[]);
    [key: string]: any;
}

export interface BoardNodeLink {
    from: BoardNode;
    to: BoardNode;
    stroke: string;
    pulsing?: boolean;
    [key: string]: any;
}

export interface NodeLabel {
    text: string;
    color?: string;
    pulsing?: boolean;
}
