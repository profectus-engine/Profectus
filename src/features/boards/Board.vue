<template>
    <panZoom
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
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
        @mouseup="() => endDragging(dragging)"
        @touchend="() => endDragging(dragging)"
        @mouseleave="() => endDragging(dragging)"
    >
        <svg class="stage" width="100%" height="100%">
            <g class="g1">
                <transition-group name="link" appear>
                    <g v-for="(link, i) in links || []" :key="i">
                        <BoardLinkVue :link="link" />
                    </g>
                </transition-group>
                <transition-group name="grow" :duration="500" appear>
                    <g v-for="node in sortedNodes" :key="node.id" style="transition-duration: 0s">
                        <BoardNodeVue
                            :node="node"
                            :nodeType="types[node.type]"
                            :dragging="draggingNode"
                            :dragged="dragged"
                            :hasDragged="hasDragged"
                            :receivingNode="receivingNode?.id === node.id"
                            :selectedNode="selectedNode"
                            :selectedAction="selectedAction"
                            @mouseDown="mouseDown"
                            @endDragging="endDragging"
                        />
                    </g>
                </transition-group>
            </g>
        </svg>
    </panZoom>
</template>

<script setup lang="ts">
import { BoardNode, GenericBoard, getNodeProperty } from "features/boards/board";
import { FeatureComponent, Visibility } from "features/feature";
import { PersistentState } from "game/persistence";
import { computed, ref, toRefs } from "vue";
import panZoom from "vue-panzoom";
import BoardLinkVue from "./BoardLink.vue";
import BoardNodeVue from "./BoardNode.vue";

const _props = defineProps<FeatureComponent<GenericBoard>>();
const props = toRefs(_props);

const lastMousePosition = ref({ x: 0, y: 0 });
const dragged = ref({ x: 0, y: 0 });
const dragging = ref<number | null>(null);
const hasDragged = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stage = ref<any>(null);

const draggingNode = computed(() =>
    dragging.value == null ? undefined : props.nodes.value.find(node => node.id === dragging.value)
);

const sortedNodes = computed(() => {
    const nodes = props.nodes.value.slice();
    if (draggingNode.value) {
        const node = nodes.splice(nodes.indexOf(draggingNode.value), 1)[0];
        nodes.push(node);
    }
    return nodes;
});

const receivingNode = computed(() => {
    const node = draggingNode.value;
    if (node == null) {
        return null;
    }

    const position = {
        x: node.position.x + dragged.value.x,
        y: node.position.y + dragged.value.y
    };
    let smallestDistance = Number.MAX_VALUE;
    return props.nodes.value.reduce((smallest: BoardNode | null, curr: BoardNode) => {
        if (curr.id === node.id) {
            return smallest;
        }
        const nodeType = props.types.value[curr.type];
        const canAccept = getNodeProperty(nodeType.canAccept, curr);
        if (!canAccept) {
            return smallest;
        }

        const distanceSquared =
            Math.pow(position.x - curr.position.x, 2) + Math.pow(position.y - curr.position.y, 2);
        let size = getNodeProperty(nodeType.size, curr);
        if (distanceSquared > smallestDistance || distanceSquared > size * size) {
            return smallest;
        }

        smallestDistance = distanceSquared;
        return curr;
    }, null);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onInit(panzoomInstance: any) {
    panzoomInstance.setTransformOrigin(null);
}

function mouseDown(e: MouseEvent | TouchEvent, nodeID: number | null = null, draggable = false) {
    if (dragging.value == null) {
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
            dragging.value = nodeID;
        }
    }
    if (nodeID != null) {
        props[PersistentState].value.selectedNode = null;
        props[PersistentState].value.selectedAction = null;
    }
}

function drag(e: MouseEvent | TouchEvent) {
    const zoom = stage.value.$panZoomInstance.getTransform().scale;

    let clientX, clientY;
    if ("touches" in e) {
        if (e.touches.length === 1) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            endDragging(dragging.value);
            return;
        }
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    dragged.value = {
        x: dragged.value.x + (clientX - lastMousePosition.value.x) / zoom,
        y: dragged.value.y + (clientY - lastMousePosition.value.y) / zoom
    };
    lastMousePosition.value = {
        x: clientX,
        y: clientY
    };

    if (Math.abs(dragged.value.x) > 10 || Math.abs(dragged.value.y) > 10) {
        hasDragged.value = true;
    }

    if (dragging.value) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function endDragging(nodeID: number | null) {
    if (dragging.value != null && dragging.value === nodeID && draggingNode.value != null) {
        draggingNode.value.position.x += Math.round(dragged.value.x / 25) * 25;
        draggingNode.value.position.y += Math.round(dragged.value.y / 25) * 25;

        const nodes = props.nodes.value;
        nodes.splice(nodes.indexOf(draggingNode.value), 1);
        nodes.push(draggingNode.value);

        if (receivingNode.value) {
            props.types.value[receivingNode.value.type].onDrop?.(
                receivingNode.value,
                draggingNode.value
            );
        }

        dragging.value = null;
    } else if (!hasDragged.value) {
        props[PersistentState].value.selectedNode = null;
        props[PersistentState].value.selectedAction = null;
    }
}
</script>

<style>
.vue-pan-zoom-scene {
    width: 100%;
    height: 100%;
    cursor: move;
}

.g1 {
    transition-duration: 0s;
}

.link-enter-from,
.link-leave-to {
    opacity: 0;
}
</style>
