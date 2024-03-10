import Board from "./Board.vue";
import Draggable from "./Draggable.vue";
import { Component, GatherProps, GenericComponent, jsx } from "features/feature";
import { globalBus } from "game/events";
import { Persistent, persistent } from "game/persistence";
import type { PanZoom } from "panzoom";
import { Direction, isFunction } from "util/common";
import type { Computable, ProcessedComputable } from "util/computed";
import { convertComputable } from "util/computed";
import { VueFeature } from "util/vue";
import type { ComponentPublicInstance, Ref } from "vue";
import { computed, nextTick, ref, unref, watchEffect } from "vue";
import panZoom from "vue-panzoom";

// Register panzoom so it can be used in Board.vue
globalBus.on("setupVue", app => panZoom.install(app));

/** A type representing the position of a node. */
export type NodePosition = { x: number; y: number };

/**
 * A type representing a computable value for a node on the board. Used for node types to return different values based on the given node and the state of the board.
 */
export type NodeComputable<T, R, S extends unknown[] = []> =
    | Computable<R>
    | ((node: T, ...args: S) => R);

/**
 * Gets the value of a property for a specified node.
 * @param property The property to find the value of
 * @param node The node to get the property of
 */
export function unwrapNodeRef<T, R, S extends unknown[]>(
    property: NodeComputable<T, R, S>,
    node: T,
    ...args: S
): R {
    return isFunction<R, [T, ...S], ProcessedComputable<R>>(property)
        ? property(node, ...args)
        : unref(property);
}

/**
 * Create a computed ref that can assist in assigning new nodes an ID unique from all current nodes.
 * @param nodes The list of current nodes with IDs as properties
 * @returns A computed ref that will give the value of the next unique ID
 */
export function setupUniqueIds(nodes: Computable<{ id: number }[]>) {
    const processedNodes = convertComputable(nodes);
    return computed(() => Math.max(-1, ...unref(processedNodes).map(node => node.id)) + 1);
}

/** An object that configures a {@link DraggableNode}. */
export interface DraggableNodeOptions<T> {
    /** A ref to the specific instance of the Board vue component the node will be draggable on. Obtained by passing a suitable ref as the "ref" attribute to the <Board> element. */
    board: Ref<ComponentPublicInstance<typeof Board> | undefined>;
    /** Getter function to go from the node (typically ID) to the position of said node. */
    getPosition: (node: T) => NodePosition;
    /** Setter function to update the position of a node. */
    setPosition: (node: T, position: NodePosition) => void;
    /** A list of nodes that the currently dragged node can be dropped upon. */
    receivingNodes?: NodeComputable<T, T[]>;
    /** The maximum distance (in pixels, before zoom) away a node can be and still drop onto a receiving node. */
    dropAreaRadius?: NodeComputable<T, number>;
    /** A callback for when a node gets dropped upon a receiving node. */
    onDrop?: (acceptingNode: T, draggingNode: T) => void;
}

/** An object that represents a system for moving nodes on a board by dragging them. */
export interface DraggableNode<T> {
    /** A ref to the node currently being moved. */
    nodeBeingDragged: Ref<T | undefined>;
    /** A ref to the node the node being dragged could be dropped upon if let go, if any. The node closest to the node being dragged if there are more than one within the drop area radius. */
    receivingNode: Ref<T | undefined>;
    /** A ref to whether or not the node being dragged has actually been dragged away from its starting position. */
    hasDragged: Ref<boolean>;
    /** The position of the node being dragged relative to where it started at the beginning of the drag. */
    dragDelta: Ref<NodePosition>;
    /** The nodes that can receive the node currently being dragged. */
    receivingNodes: Ref<T[]>;
    /** A function to call whenever a drag should start, that takes the mouse event that triggered it. Typically attached to each node's onMouseDown listener. */
    startDrag: (e: MouseEvent | TouchEvent, node: T) => void;
    /** A function to call whenever a drag should end, typically attached to the Board's onMouseUp and onMouseLeave listeners. */
    endDrag: VoidFunction;
    /** A function to call when the mouse moves during a drag, typically attached to the Board's onDrag listener. */
    drag: (e: MouseEvent | TouchEvent) => void;
}

/**
 * Sets up a system to allow nodes to be moved within a board by dragging and dropping.
 * Also allows for dropping nodes on other nodes to trigger code.
 * @param options Draggable node options.
 * @returns A DraggableNode object.
 */
export function setupDraggableNode<T>(options: DraggableNodeOptions<T>): DraggableNode<T> {
    const nodeBeingDragged = ref<T>();
    const receivingNode = ref<T>();
    const hasDragged = ref(false);
    const dragDelta = ref({ x: 0, y: 0 });
    const receivingNodes = computed(() =>
        nodeBeingDragged.value == null
            ? []
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              unwrapNodeRef(options.receivingNodes ?? [], nodeBeingDragged.value!)
    );
    const dropAreaRadius = options.dropAreaRadius ?? 50;

    const mousePosition = ref<NodePosition>();
    const lastMousePosition = ref({ x: 0, y: 0 });

    watchEffect(() => {
        const node = nodeBeingDragged.value;
        if (node == null) {
            return null;
        }

        const originalPosition = options.getPosition(node);
        const position = {
            x: originalPosition.x + dragDelta.value.x,
            y: originalPosition.y + dragDelta.value.y
        };
        let smallestDistance = Number.MAX_VALUE;

        receivingNode.value = unref(receivingNodes).reduce((smallest: T | undefined, curr: T) => {
            if ((curr as T) === node) {
                return smallest;
            }

            const { x, y } = options.getPosition(curr);
            const distanceSquared = Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2);
            const size = unwrapNodeRef(dropAreaRadius, curr);
            if (distanceSquared > smallestDistance || distanceSquared > size * size) {
                return smallest;
            }

            smallestDistance = distanceSquared;
            return curr;
        }, undefined);
    });

    const result = {
        nodeBeingDragged,
        receivingNode,
        hasDragged,
        dragDelta,
        receivingNodes,
        startDrag: function (e: MouseEvent | TouchEvent, node: T) {
            e.preventDefault();
            e.stopPropagation();

            let clientX, clientY;
            if ("touches" in e) {
                if (e.touches.length === 1) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    return;
                }
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            lastMousePosition.value = {
                x: clientX,
                y: clientY
            };
            dragDelta.value = { x: 0, y: 0 };
            hasDragged.value = false;

            nodeBeingDragged.value = node;
        },
        endDrag: function () {
            if (nodeBeingDragged.value == null) {
                return;
            }
            if (receivingNode.value == null) {
                const { x, y } = options.getPosition(nodeBeingDragged.value);
                const newX = x + Math.round(dragDelta.value.x / 25) * 25;
                const newY = y + Math.round(dragDelta.value.y / 25) * 25;
                options.setPosition(nodeBeingDragged.value, { x: newX, y: newY });
            }

            if (receivingNode.value != null) {
                options.onDrop?.(receivingNode.value, nodeBeingDragged.value);
            }

            nodeBeingDragged.value = undefined;
        },
        drag: function (e: MouseEvent | TouchEvent) {
            const panZoomInstance = options.board.value?.panZoomInstance as PanZoom | undefined;
            if (panZoomInstance == null || nodeBeingDragged.value == null) {
                return;
            }

            const { x, y, scale } = panZoomInstance.getTransform();

            let clientX, clientY;
            if ("touches" in e) {
                if (e.touches.length === 1) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    result.endDrag();
                    mousePosition.value = undefined;
                    return;
                }
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            mousePosition.value = {
                x: (clientX - x) / scale,
                y: (clientY - y) / scale
            };

            dragDelta.value = {
                x: dragDelta.value.x + (clientX - lastMousePosition.value.x) / scale,
                y: dragDelta.value.y + (clientY - lastMousePosition.value.y) / scale
            };
            lastMousePosition.value = {
                x: clientX,
                y: clientY
            };

            if (Math.abs(dragDelta.value.x) > 10 || Math.abs(dragDelta.value.y) > 10) {
                hasDragged.value = true;
            }

            e.preventDefault();
            e.stopPropagation();
        }
    };
    return result;
}

/** An object that configures how to make a vue feature draggable using {@link makeDraggable}. */
export interface MakeDraggableOptions<T> {
    /** The node ID to use for the vue feature. */
    id: T;
    /** A reference to the current node being dragged, typically from {@link setupDraggableNode}. */
    nodeBeingDragged: Ref<T | undefined>;
    /** A reference to whether or not the node being dragged has been moved away from its initial position. Typically from {@link setupDraggableNode}. */
    hasDragged: Ref<boolean>;
    /** A reference to how far the node being dragged is from its initial position. Typically from {@link setupDraggableNode}. */
    dragDelta: Ref<NodePosition>;
    /** A function to call when a drag is supposed to start. Typically from {@link setupDraggableNode}. */
    startDrag: (e: MouseEvent | TouchEvent, id: T) => void;
    /** A function to call when a drag is supposed to end. Typically from {@link setupDraggableNode}. */
    endDrag: VoidFunction;
    /** A callback that's called when the element is pressed down. Fires before drag starts, and returning `false` will prevent the drag from happening. */
    onMouseDown?: (e: MouseEvent | TouchEvent) => boolean | void;
    /** A callback that's called when the mouse is lifted off the element. */
    onMouseUp?: (e: MouseEvent | TouchEvent) => boolean | void;
    /** The initial position of the node on the board. Defaults to (0, 0). */
    initialPosition?: NodePosition;
}

/**
 * Makes a vue feature draggable on a Board.
 * @param element The vue feature to make draggable.
 * @param options The options to configure the dragging behavior.
 */
export function makeDraggable<T extends VueFeature, S>(
    element: T,
    options: MakeDraggableOptions<S>
): asserts element is T & { position: Persistent<NodePosition> } {
    const position = persistent(options.initialPosition ?? { x: 0, y: 0 });
    (element as T & { position: Persistent<NodePosition> }).position = position;
    const computedPosition = computed(() => {
        if (options.nodeBeingDragged.value === options.id) {
            return {
                x: position.value.x + options.dragDelta.value.x,
                y: position.value.y + options.dragDelta.value.y
            };
        }
        return position.value;
    });

    function handleMouseDown(e: MouseEvent | TouchEvent) {
        if (options.onMouseDown?.(e) === false) {
            return;
        }

        if (options.nodeBeingDragged.value == null) {
            options.startDrag(e, options.id);
        }
    }

    function handleMouseUp(e: MouseEvent | TouchEvent) {
        options.onMouseUp?.(e);
    }

    nextTick(() => {
        const elementComponent = element[Component];
        const elementGatherProps = element[GatherProps].bind(element);
        element[Component] = Draggable as GenericComponent;
        element[GatherProps] = function gatherTooltipProps(this: typeof options) {
            return {
                element: {
                    [Component]: elementComponent,
                    [GatherProps]: elementGatherProps
                },
                mouseDown: handleMouseDown,
                mouseUp: handleMouseUp,
                position: computedPosition
            };
        }.bind(options);
    });
}

/** An object that configures how to setup a list of actions using {@link setupActions}. */
export interface SetupActionsOptions<T extends NodePosition> {
    /** The node to display actions upon, or undefined when the actions should be hidden. */
    node: Computable<T | undefined>;
    /** Whether or not to currently display the actions. */
    shouldShowActions?: NodeComputable<T, boolean>;
    /** The list of actions to display. Actions are arbitrary JSX elements. */
    actions: NodeComputable<T, ((position: NodePosition) => JSX.Element)[]>;
    /** The distance from the node to place the actions. */
    distance: NodeComputable<T, number>;
    /** The arc length to place between actions, in radians. */
    arcLength?: NodeComputable<T, number>;
}

/**
 * Sets up a system where a list of actions, which are arbitrary JSX elements, will get displayed around a node radially, under given conditions. The actions are radially centered around 3/2 PI (Down).
 * @param options Setup actions options.
 * @returns A JSX function to render the actions.
 */
export function setupActions<T extends NodePosition>(options: SetupActionsOptions<T>) {
    const node = convertComputable(options.node);
    return jsx(() => {
        const currNode = unref(node);
        if (currNode == null) {
            return "";
        }

        const actions = unwrapNodeRef(options.actions, currNode);
        const shouldShow = unwrapNodeRef(options.shouldShowActions, currNode) ?? true;
        if (!shouldShow) {
            return <>{actions.map(f => f(currNode))}</>;
        }

        const distance = unwrapNodeRef(options.distance, currNode);
        const arcLength = unwrapNodeRef(options.arcLength, currNode) ?? Math.PI / 6;
        const firstAngle = Math.PI / 2 - ((actions.length - 1) / 2) * arcLength;
        return (
            <>
                {actions.map((f, index) =>
                    f({
                        x: currNode.x + Math.cos(firstAngle + index * arcLength) * distance,
                        y: currNode.y + Math.sin(firstAngle + index * arcLength) * distance
                    })
                )}
            </>
        );
    });
}

/**
 * Moves a node so that it is sufficiently far away from any other nodes, to prevent overlapping.
 * @param nodeToPlace The node to find a spot for, with it's current/preffered position.
 * @param nodes The list of nodes to make sure nodeToPlace is far enough away from.
 * @param radius How far away nodeToPlace must be from any other nodes.
 * @param direction The direction to push the nodeToPlace until it finds an available spot.
 */
export function placeInAvailableSpace<T extends NodePosition>(
    nodeToPlace: T,
    nodes: T[],
    radius = 100,
    direction = Direction.Right
) {
    nodes = nodes
        .filter(n => {
            // Exclude self
            if (n === nodeToPlace) {
                return false;
            }

            // Exclude nodes that aren't within the corridor we'll be moving within
            if (
                (direction === Direction.Down || direction === Direction.Up) &&
                Math.abs(n.x - nodeToPlace.x) > radius
            ) {
                return false;
            }
            if (
                (direction === Direction.Left || direction === Direction.Right) &&
                Math.abs(n.y - nodeToPlace.y) > radius
            ) {
                return false;
            }

            // Exclude nodes in the wrong direction
            return !(
                (direction === Direction.Right && n.x < nodeToPlace.x - radius) ||
                (direction === Direction.Left && n.x > nodeToPlace.x + radius) ||
                (direction === Direction.Up && n.y > nodeToPlace.y + radius) ||
                (direction === Direction.Down && n.y < nodeToPlace.y - radius)
            );
        })
        .sort(
            direction === Direction.Right
                ? (a, b) => a.x - b.x
                : direction === Direction.Left
                ? (a, b) => b.x - a.x
                : direction === Direction.Up
                ? (a, b) => b.y - a.y
                : (a, b) => a.y - b.y
        );

    for (let i = 0; i < nodes.length; i++) {
        const nodeToCheck = nodes[i];
        const distance =
            direction === Direction.Right || direction === Direction.Left
                ? Math.abs(nodeToPlace.x - nodeToCheck.x)
                : Math.abs(nodeToPlace.y - nodeToCheck.y);

        // If we're too close to this node, move further
        // Keep in mind positions start at top right, so "down" means increasing Y
        if (distance < radius) {
            if (direction === Direction.Right) {
                nodeToPlace.x = nodeToCheck.x + radius;
            } else if (direction === Direction.Left) {
                nodeToPlace.x = nodeToCheck.x - radius;
            } else if (direction === Direction.Up) {
                nodeToPlace.y = nodeToCheck.y - radius;
            } else if (direction === Direction.Down) {
                nodeToPlace.y = nodeToCheck.y + radius;
            }
        } else if (i > 0 && distance > radius) {
            // If we're further from this node than the radius, then the nodes are past us and we can early exit
            break;
        }
    }
}
