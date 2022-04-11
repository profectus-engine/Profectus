import BoardComponent from "features/boards/Board.vue";
import {
    Component,
    OptionsFunc,
    findFeatures,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import { globalBus } from "game/events";
import { State, Persistent, PersistentState, persistent } from "game/persistence";
import { isFunction } from "util/common";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Unsubscribe } from "nanoevents";
import { computed, Ref, unref } from "vue";
import { Link } from "../links/links";

export const BoardType = Symbol("Board");

export type NodeComputable<T> = Computable<T> | ((node: BoardNode) => T);

export enum ProgressDisplay {
    Outline = "Outline",
    Fill = "Fill"
}

export enum Shape {
    Circle = "Circle",
    Diamond = "Triangle"
}

export interface BoardNode {
    id: number;
    position: {
        x: number;
        y: number;
    };
    type: string;
    state?: State;
    pinned?: boolean;
}

export interface BoardNodeLink extends Omit<Link, "startNode" | "endNode"> {
    startNode: BoardNode;
    endNode: BoardNode;
    pulsing?: boolean;
}

export interface NodeLabel {
    text: string;
    color?: string;
    pulsing?: boolean;
}

export type BoardData = {
    nodes: BoardNode[];
    selectedNode: number | null;
    selectedAction: string | null;
};

export interface NodeTypeOptions {
    title: NodeComputable<string>;
    label?: NodeComputable<NodeLabel | null>;
    size: NodeComputable<number>;
    draggable?: NodeComputable<boolean>;
    shape: NodeComputable<Shape>;
    canAccept?: boolean | Ref<boolean> | ((node: BoardNode, otherNode: BoardNode) => boolean);
    progress?: NodeComputable<number>;
    progressDisplay?: NodeComputable<ProgressDisplay>;
    progressColor?: NodeComputable<string>;
    fillColor?: NodeComputable<string>;
    outlineColor?: NodeComputable<string>;
    titleColor?: NodeComputable<string>;
    actions?: BoardNodeActionOptions[];
    actionDistance?: NodeComputable<number>;
    onClick?: (node: BoardNode) => void;
    onDrop?: (node: BoardNode, otherNode: BoardNode) => void;
    update?: (node: BoardNode, diff: number) => void;
}

export interface BaseNodeType {
    nodes: Ref<BoardNode[]>;
}

export type NodeType<T extends NodeTypeOptions> = Replace<
    T & BaseNodeType,
    {
        title: GetComputableType<T["title"]>;
        label: GetComputableType<T["label"]>;
        size: GetComputableTypeWithDefault<T["size"], 50>;
        draggable: GetComputableTypeWithDefault<T["draggable"], false>;
        shape: GetComputableTypeWithDefault<T["shape"], Shape.Circle>;
        canAccept: GetComputableTypeWithDefault<T["canAccept"], false>;
        progress: GetComputableType<T["progress"]>;
        progressDisplay: GetComputableTypeWithDefault<T["progressDisplay"], ProgressDisplay.Fill>;
        progressColor: GetComputableTypeWithDefault<T["progressColor"], "none">;
        fillColor: GetComputableType<T["fillColor"]>;
        outlineColor: GetComputableType<T["outlineColor"]>;
        titleColor: GetComputableType<T["titleColor"]>;
        actions?: GenericBoardNodeAction[];
        actionDistance: GetComputableTypeWithDefault<T["actionDistance"], number>;
    }
>;

export type GenericNodeType = Replace<
    NodeType<NodeTypeOptions>,
    {
        size: NodeComputable<number>;
        draggable: NodeComputable<boolean>;
        shape: NodeComputable<Shape>;
        canAccept: NodeComputable<boolean>;
        progressDisplay: NodeComputable<ProgressDisplay>;
        progressColor: NodeComputable<string>;
        actionDistance: NodeComputable<number>;
    }
>;

export interface BoardNodeActionOptions {
    id: string;
    visibility?: NodeComputable<Visibility>;
    icon: NodeComputable<string>;
    fillColor?: NodeComputable<string>;
    tooltip: NodeComputable<string>;
    links?: NodeComputable<BoardNodeLink[]>;
    onClick: (node: BoardNode) => boolean | undefined;
}

export interface BaseBoardNodeAction {
    links?: Ref<BoardNodeLink[]>;
}

export type BoardNodeAction<T extends BoardNodeActionOptions> = Replace<
    T & BaseBoardNodeAction,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        icon: GetComputableType<T["icon"]>;
        fillColor: GetComputableType<T["fillColor"]>;
        tooltip: GetComputableType<T["tooltip"]>;
        links: GetComputableType<T["links"]>;
    }
>;

export type GenericBoardNodeAction = Replace<
    BoardNodeAction<BoardNodeActionOptions>,
    {
        visibility: NodeComputable<Visibility>;
    }
>;

export interface BoardOptions {
    visibility?: Computable<Visibility>;
    height?: Computable<string>;
    width?: Computable<string>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    startNodes: () => Omit<BoardNode, "id">[];
    types: Record<string, NodeTypeOptions>;
}

export interface BaseBoard extends Persistent<BoardData> {
    id: string;
    links: Ref<BoardNodeLink[] | null>;
    nodes: Ref<BoardNode[]>;
    selectedNode: Ref<BoardNode | null>;
    selectedAction: Ref<GenericBoardNodeAction | null>;
    type: typeof BoardType;
    [Component]: typeof BoardComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Board<T extends BoardOptions> = Replace<
    T & BaseBoard,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        types: Record<string, GenericNodeType>;
        height: GetComputableType<T["height"]>;
        width: GetComputableType<T["width"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
    }
>;

export type GenericBoard = Replace<
    Board<BoardOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createBoard<T extends BoardOptions>(
    optionsFunc: OptionsFunc<T, Board<T>, BaseBoard>
): Board<T> {
    return createLazyProxy(
        persistent => {
            const board = Object.assign(persistent, optionsFunc());
            board.id = getUniqueID("board-");
            board.type = BoardType;
            board[Component] = BoardComponent;

            board.nodes = computed(() => processedBoard[PersistentState].value.nodes);
            board.selectedNode = computed(
                () =>
                    processedBoard.nodes.value.find(
                        node => node.id === board[PersistentState].value.selectedNode
                    ) || null
            );
            board.selectedAction = computed(() => {
                const selectedNode = processedBoard.selectedNode.value;
                if (selectedNode == null) {
                    return null;
                }
                const type = processedBoard.types[selectedNode.type];
                if (type.actions == null) {
                    return null;
                }
                return (
                    type.actions.find(
                        action => action.id === processedBoard[PersistentState].value.selectedAction
                    ) || null
                );
            });
            board.links = computed(() => {
                if (processedBoard.selectedAction.value == null) {
                    return null;
                }
                if (
                    processedBoard.selectedAction.value.links &&
                    processedBoard.selectedNode.value
                ) {
                    return getNodeProperty(
                        processedBoard.selectedAction.value.links,
                        processedBoard.selectedNode.value
                    );
                }
                return null;
            });
            processComputable(board as T, "visibility");
            setDefault(board, "visibility", Visibility.Visible);
            processComputable(board as T, "width");
            setDefault(board, "width", "100%");
            processComputable(board as T, "height");
            setDefault(board, "height", "400px");
            processComputable(board as T, "classes");
            processComputable(board as T, "style");

            for (const type in board.types) {
                const nodeType: NodeTypeOptions & Partial<BaseNodeType> = board.types[type];

                processComputable(nodeType as NodeTypeOptions, "title");
                processComputable(nodeType as NodeTypeOptions, "label");
                processComputable(nodeType as NodeTypeOptions, "size");
                setDefault(nodeType, "size", 50);
                processComputable(nodeType as NodeTypeOptions, "draggable");
                setDefault(nodeType, "draggable", false);
                processComputable(nodeType as NodeTypeOptions, "shape");
                setDefault(nodeType, "shape", Shape.Circle);
                processComputable(nodeType as NodeTypeOptions, "canAccept");
                setDefault(nodeType, "canAccept", false);
                processComputable(nodeType as NodeTypeOptions, "progress");
                processComputable(nodeType as NodeTypeOptions, "progressDisplay");
                setDefault(nodeType, "progressDisplay", ProgressDisplay.Fill);
                processComputable(nodeType as NodeTypeOptions, "progressColor");
                setDefault(nodeType, "progressColor", "none");
                processComputable(nodeType as NodeTypeOptions, "fillColor");
                processComputable(nodeType as NodeTypeOptions, "outlineColor");
                processComputable(nodeType as NodeTypeOptions, "titleColor");
                processComputable(nodeType as NodeTypeOptions, "actionDistance");
                setDefault(nodeType, "actionDistance", Math.PI / 6);
                nodeType.nodes = computed(() =>
                    board[PersistentState].value.nodes.filter(node => node.type === type)
                );
                setDefault(nodeType, "onClick", function (node: BoardNode) {
                    board[PersistentState].value.selectedNode = node.id;
                });

                if (nodeType.actions) {
                    for (const action of nodeType.actions) {
                        processComputable(action, "visibility");
                        setDefault(action, "visibility", Visibility.Visible);
                        processComputable(action, "icon");
                        processComputable(action, "fillColor");
                        processComputable(action, "tooltip");
                        processComputable(action, "links");
                    }
                }
            }

            board[GatherProps] = function (this: GenericBoard) {
                const {
                    nodes,
                    types,
                    [PersistentState]: state,
                    visibility,
                    width,
                    height,
                    style,
                    classes,
                    links,
                    selectedAction,
                    selectedNode
                } = this;
                return {
                    nodes,
                    types,
                    [PersistentState]: state,
                    visibility,
                    width,
                    height,
                    style: unref(style),
                    classes,
                    links,
                    selectedAction,
                    selectedNode
                };
            };

            // This is necessary because board.types is different from T and Board
            const processedBoard = board as unknown as Board<T>;
            return processedBoard;
        },
        persistent<BoardData>({
            nodes: [],
            selectedNode: null,
            selectedAction: null
        })
    );
}

export function getNodeProperty<T>(property: NodeComputable<T>, node: BoardNode): T {
    return isFunction(property) ? property(node) : unref(property);
}

export function getUniqueNodeID(board: GenericBoard): number {
    let id = 0;
    board.nodes.value.forEach(node => {
        if (node.id >= id) {
            id = node.id + 1;
        }
    });
    return id;
}

const listeners: Record<string, Unsubscribe | undefined> = {};
globalBus.on("addLayer", layer => {
    const boards: GenericBoard[] = findFeatures(layer, BoardType) as GenericBoard[];
    listeners[layer.id] = layer.on("postUpdate", diff => {
        boards.forEach(board => {
            Object.values(board.types).forEach(type =>
                type.nodes.value.forEach(node => type.update?.(node, diff))
            );
        });
    });
});
globalBus.on("removeLayer", layer => {
    // unsubscribe from postUpdate
    listeners[layer.id]?.();
    listeners[layer.id] = undefined;
});
