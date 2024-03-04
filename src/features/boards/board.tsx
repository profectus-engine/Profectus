import Board from "features/boards/Board.vue";
import Draggable from "features/boards/Draggable.vue";
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

globalBus.on("setupVue", app => panZoom.install(app));

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

export function setupUniqueIds(nodes: Computable<{ id: number }[]>) {
    const processedNodes = convertComputable(nodes);
    return computed(() => Math.max(-1, ...unref(processedNodes).map(node => node.id)) + 1);
}

export function setupSelectable<T>() {
    const selected = ref<T>();
    return {
        select: function (node: T) {
            selected.value = node;
        },
        deselect: function () {
            selected.value = undefined;
        },
        selected
    };
}

export function setupDraggableNode<T>(options: {
    board: Ref<ComponentPublicInstance<typeof Board> | undefined>;
    getPosition: (node: T) => NodePosition;
    setPosition: (node: T, position: NodePosition) => void;
    receivingNodes?: NodeComputable<T, T[]>;
    dropAreaRadius?: NodeComputable<T, number>;
    onDrop?: (acceptingNode: T, draggingNode: T) => void;
}) {
    const nodeBeingDragged = ref<T>();
    const receivingNode = ref<T>();
    const hasDragged = ref(false);
    const mousePosition = ref<NodePosition>();
    const lastMousePosition = ref({ x: 0, y: 0 });
    const dragDelta = ref({ x: 0, y: 0 });
    const receivingNodes = computed(() =>
        nodeBeingDragged.value == null
            ? []
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              unwrapNodeRef(options.receivingNodes ?? [], nodeBeingDragged.value!)
    );
    const dropAreaRadius = options.dropAreaRadius ?? 50;

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
        mousePosition,
        lastMousePosition,
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
            if (panZoomInstance == null) {
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

            if (nodeBeingDragged.value != null) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };
    return result;
}

export function makeDraggable<T extends VueFeature, S>(
    element: T,
    options: {
        id: S;
        nodeBeingDragged: Ref<S | undefined>;
        hasDragged: Ref<boolean>;
        dragDelta: Ref<NodePosition>;
        startDrag: (e: MouseEvent | TouchEvent, id: S) => void;
        endDrag: VoidFunction;
        onMouseDown?: (e: MouseEvent | TouchEvent) => boolean | void;
        onMouseUp?: (e: MouseEvent | TouchEvent) => boolean | void;
        initialPosition?: NodePosition;
    }
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

export function setupActions<T extends NodePosition>(options: {
    node: Computable<T | undefined>;
    shouldShowActions?: NodeComputable<T, boolean>;
    actions: NodeComputable<T, ((position: NodePosition) => JSX.Element)[]>;
    distance: NodeComputable<T, number>;
    arcLength?: NodeComputable<T, number>;
}) {
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
