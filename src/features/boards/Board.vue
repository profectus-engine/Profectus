<template>
    <panZoom
        v-if="isVisible(visibility)"
        :style="[
            {
                width,
                height
            },
            style
        ]"
        :class="classes"
        selector=".g1"
        :options="{ initialZoom: 1, minZoom: 0.1, maxZoom: 10, zoomDoubleClickSpeed: 1 }"
        ref="stage"
        @init="onInit"
        @mousemove="drag"
        @touchmove="drag"
        @mousedown="(e: MouseEvent) => mouseDown(e)"
        @touchstart="(e: TouchEvent) => mouseDown(e)"
        @mouseup="() => endDragging(unref(draggingNode))"
        @touchend.passive="() => endDragging(unref(draggingNode))"
        @mouseleave="() => endDragging(unref(draggingNode))"
    >
        <svg class="stage" width="100%" height="100%">
            <g class="g1">
                <transition-group name="link" appear>
                    <g
                        v-for="link in unref(links) || []"
                        :key="`${link.startNode.id}-${link.endNode.id}`"
                    >
                        <BoardLinkVue :link="link" />
                    </g>
                </transition-group>
                <transition-group name="grow" :duration="500" appear>
                    <g v-for="node in sortedNodes" :key="node.id" style="transition-duration: 0s">
                        <BoardNodeVue
                            :node="node"
                            :nodeType="types[node.type]"
                            :dragging="unref(draggingNode)"
                            :dragged="unref(draggingNode) === node ? dragged : undefined"
                            :hasDragged="hasDragged"
                            :receivingNode="unref(receivingNode)?.id === node.id"
                            :selectedNode="unref(selectedNode)"
                            :selectedAction="unref(selectedAction)"
                            @mouseDown="mouseDown"
                            @endDragging="endDragging"
                            @clickAction="(actionId: string) => clickAction(node, actionId)"
                        />
                    </g>
                </transition-group>
            </g>
        </svg>
    </panZoom>
</template>

<script setup lang="ts">
import type {
    BoardData,
    BoardNode,
    BoardNodeLink,
    GenericBoardNodeAction,
    GenericNodeType
} from "features/boards/board";
import { getNodeProperty } from "features/boards/board";
import type { StyleValue } from "features/feature";
import { Visibility, isVisible } from "features/feature";
import type { ProcessedComputable } from "util/computed";
import { Ref, computed, ref, toRefs, unref, watchEffect } from "vue";
import BoardLinkVue from "./BoardLink.vue";
import BoardNodeVue from "./BoardNode.vue";

const _props = defineProps<{
    nodes: Ref<BoardNode[]>;
    types: Record<string, GenericNodeType>;
    state: Ref<BoardData>;
    visibility: ProcessedComputable<Visibility | boolean>;
    width?: ProcessedComputable<string>;
    height?: ProcessedComputable<string>;
    style?: ProcessedComputable<StyleValue>;
    classes?: ProcessedComputable<Record<string, boolean>>;
    links: Ref<BoardNodeLink[] | null>;
    selectedAction: Ref<GenericBoardNodeAction | null>;
    selectedNode: Ref<BoardNode | null>;
    draggingNode: Ref<BoardNode | null>;
    receivingNode: Ref<BoardNode | null>;
    mousePosition: Ref<{ x: number; y: number } | null>;
    setReceivingNode: (node: BoardNode | null) => void;
    setDraggingNode: (node: BoardNode | null) => void;
}>();
const props = toRefs(_props);

const lastMousePosition = ref({ x: 0, y: 0 });
const dragged = ref({ x: 0, y: 0 });
const hasDragged = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stage = ref<any>(null);

const sortedNodes = computed(() => {
    const nodes = props.nodes.value.slice();
    if (props.draggingNode.value) {
        const node = nodes.splice(nodes.indexOf(props.draggingNode.value), 1)[0];
        nodes.push(node);
    }
    return nodes;
});

watchEffect(() => {
    const node = props.draggingNode.value;
    if (node == null) {
        return null;
    }

    const position = {
        x: node.position.x + dragged.value.x,
        y: node.position.y + dragged.value.y
    };
    let smallestDistance = Number.MAX_VALUE;

    props.setReceivingNode.value(
        props.nodes.value.reduce((smallest: BoardNode | null, curr: BoardNode) => {
            if (curr.id === node.id) {
                return smallest;
            }
            const nodeType = props.types.value[curr.type];
            const canAccept = getNodeProperty(nodeType.canAccept, curr, node);
            if (!canAccept) {
                return smallest;
            }

            const distanceSquared =
                Math.pow(position.x - curr.position.x, 2) +
                Math.pow(position.y - curr.position.y, 2);
            let size = getNodeProperty(nodeType.size, curr);
            if (distanceSquared > smallestDistance || distanceSquared > size * size) {
                return smallest;
            }

            smallestDistance = distanceSquared;
            return curr;
        }, null)
    );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onInit(panzoomInstance: any) {
    panzoomInstance.setTransformOrigin(null);
    panzoomInstance.moveTo(stage.value.$el.clientWidth / 2, stage.value.$el.clientHeight / 2);
}

function mouseDown(e: MouseEvent | TouchEvent, node: BoardNode | null = null, draggable = false) {
    if (props.draggingNode.value == null) {
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
        dragged.value = { x: 0, y: 0 };
        hasDragged.value = false;

        if (draggable) {
            props.setDraggingNode.value(node);
        }
    }
    if (node != null) {
        props.state.value.selectedNode = null;
        props.state.value.selectedAction = null;
    }
}

function drag(e: MouseEvent | TouchEvent) {
    const { x, y, scale } = stage.value.panZoomInstance.getTransform();

    let clientX, clientY;
    if ("touches" in e) {
        if (e.touches.length === 1) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            endDragging(props.draggingNode.value);
            props.mousePosition.value = null;
            return;
        }
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    props.mousePosition.value = {
        x: (clientX - x) / scale,
        y: (clientY - y) / scale
    };

    dragged.value = {
        x: dragged.value.x + (clientX - lastMousePosition.value.x) / scale,
        y: dragged.value.y + (clientY - lastMousePosition.value.y) / scale
    };
    lastMousePosition.value = {
        x: clientX,
        y: clientY
    };

    if (Math.abs(dragged.value.x) > 10 || Math.abs(dragged.value.y) > 10) {
        hasDragged.value = true;
    }

    if (props.draggingNode.value != null) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function endDragging(node: BoardNode | null) {
    if (props.draggingNode.value != null && props.draggingNode.value === node) {
        if (props.receivingNode.value == null) {
            props.draggingNode.value.position.x += Math.round(dragged.value.x / 25) * 25;
            props.draggingNode.value.position.y += Math.round(dragged.value.y / 25) * 25;
        }

        const nodes = props.nodes.value;
        nodes.push(nodes.splice(nodes.indexOf(props.draggingNode.value), 1)[0]);

        if (props.receivingNode.value) {
            props.types.value[props.receivingNode.value.type].onDrop?.(
                props.receivingNode.value,
                props.draggingNode.value
            );
        }

        props.setDraggingNode.value(null);
    } else if (!hasDragged.value) {
        props.state.value.selectedNode = null;
        props.state.value.selectedAction = null;
    }
}

function clickAction(node: BoardNode, actionId: string) {
    if (props.state.value.selectedAction === actionId) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        unref(props.selectedAction)!.onClick(unref(props.selectedNode)!);
    } else {
        props.state.value = { ...props.state.value, selectedAction: actionId };
    }
}
</script>

<style>
.vue-pan-zoom-scene {
    width: 100%;
    height: 100%;
    cursor: grab;
}

.vue-pan-zoom-scene:active {
    cursor: grabbing;
}

.g1 {
    transition-duration: 0s;
}

.link-enter-from,
.link-leave-to {
    opacity: 0;
}
</style>
