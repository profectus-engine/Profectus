<template>
    <g
        class="boardnode"
        :class="node.type"
        :style="{ opacity: dragging?.id === node.id && hasDragged ? 0.5 : 1 }"
        :transform="`translate(${position.x},${position.y})`"
    >
        <transition name="actions" appear>
            <g v-if="isSelected && actions">
                <!-- TODO move to separate file -->
                <g
                    v-for="(action, index) in actions"
                    :key="action.id"
                    class="action"
                    :class="{ selected: selectedAction?.id === action.id }"
                    :transform="`translate(
                            ${
                                (-size - 30) *
                                Math.sin(((actions.length - 1) / 2 - index) * actionDistance)
                            },
                            ${
                                (size + 30) *
                                Math.cos(((actions.length - 1) / 2 - index) * actionDistance)
                            }
                        )`"
                    @mousedown="e => performAction(e, action)"
                    @touchstart="e => performAction(e, action)"
                    @mouseup="e => actionMouseUp(e, action)"
                    @touchend.stop="e => actionMouseUp(e, action)"
                >
                    <circle
                        :fill="getNodeProperty(action.fillColor, node)"
                        r="20"
                        :stroke-width="selectedAction?.id === action.id ? 4 : 0"
                        :stroke="outlineColor"
                    />
                    <text :fill="titleColor" class="material-icons">{{
                        getNodeProperty(action.icon, node)
                    }}</text>
                </g>
            </g>
        </transition>

        <g
            class="node-container"
            @mouseenter="isHovering = true"
            @mouseleave="isHovering = false"
            @mousedown="mouseDown"
            @touchstart.passive="mouseDown"
            @mouseup="mouseUp"
            @touchend.passive="mouseUp"
        >
            <g v-if="shape === Shape.Circle">
                <circle
                    v-if="canAccept"
                    class="receiver"
                    :r="size + 8"
                    :fill="backgroundColor"
                    :stroke="receivingNode ? '#0F0' : '#0F03'"
                    :stroke-width="2"
                />

                <circle
                    class="body"
                    :r="size"
                    :fill="fillColor"
                    :stroke="outlineColor"
                    :stroke-width="4"
                />

                <circle
                    class="progressFill"
                    v-if="progressDisplay === ProgressDisplay.Fill"
                    :r="Math.max(size * progress - 2, 0)"
                    :fill="progressColor"
                />
                <circle
                    v-else
                    :r="size + 4.5"
                    class="progressRing"
                    fill="transparent"
                    :stroke-dasharray="(size + 4.5) * 2 * Math.PI"
                    :stroke-width="5"
                    :stroke-dashoffset="
                        (size + 4.5) * 2 * Math.PI - progress * (size + 4.5) * 2 * Math.PI
                    "
                    :stroke="progressColor"
                />
            </g>
            <g v-else-if="shape === Shape.Diamond" transform="rotate(45, 0, 0)">
                <rect
                    v-if="canAccept"
                    class="receiver"
                    :width="size * sqrtTwo + 16"
                    :height="size * sqrtTwo + 16"
                    :transform="`translate(${-(size * sqrtTwo + 16) / 2}, ${
                        -(size * sqrtTwo + 16) / 2
                    })`"
                    :fill="backgroundColor"
                    :stroke="receivingNode ? '#0F0' : '#0F03'"
                    :stroke-width="2"
                />

                <rect
                    class="body"
                    :width="size * sqrtTwo"
                    :height="size * sqrtTwo"
                    :transform="`translate(${(-size * sqrtTwo) / 2}, ${(-size * sqrtTwo) / 2})`"
                    :fill="fillColor"
                    :stroke="outlineColor"
                    :stroke-width="4"
                />

                <rect
                    v-if="progressDisplay === ProgressDisplay.Fill"
                    class="progressFill"
                    :width="Math.max(size * sqrtTwo * progress - 2, 0)"
                    :height="Math.max(size * sqrtTwo * progress - 2, 0)"
                    :transform="`translate(${-Math.max(size * sqrtTwo * progress - 2, 0) / 2}, ${
                        -Math.max(size * sqrtTwo * progress - 2, 0) / 2
                    })`"
                    :fill="progressColor"
                />
                <rect
                    v-else
                    class="progressDiamond"
                    :width="size * sqrtTwo + 9"
                    :height="size * sqrtTwo + 9"
                    :transform="`translate(${-(size * sqrtTwo + 9) / 2}, ${
                        -(size * sqrtTwo + 9) / 2
                    })`"
                    fill="transparent"
                    :stroke-dasharray="(size * sqrtTwo + 9) * 4"
                    :stroke-width="5"
                    :stroke-dashoffset="
                        (size * sqrtTwo + 9) * 4 - progress * (size * sqrtTwo + 9) * 4
                    "
                    :stroke="progressColor"
                />
            </g>

            <text :fill="titleColor" class="node-title">{{ title }}</text>
        </g>

        <transition name="fade" appear>
            <g v-if="label">
                <text
                    :fill="label.color || titleColor"
                    class="node-title"
                    :class="{ pulsing: label.pulsing }"
                    :y="-size - 20"
                    >{{ label.text }}
                </text>
            </g>
        </transition>

        <transition name="fade" appear>
            <text
                v-if="isSelected && selectedAction"
                :fill="titleColor"
                class="node-title"
                :y="size + 75"
                >Tap again to confirm</text
            >
        </transition>
    </g>
</template>

<script setup lang="ts">
import themes from "data/themes";
import type { BoardNode, GenericBoardNodeAction, GenericNodeType } from "features/boards/board";
import { ProgressDisplay, getNodeProperty, Shape } from "features/boards/board";
import { Visibility } from "features/feature";
import settings from "game/settings";
import { computed, ref, toRefs, unref, watch } from "vue";

const sqrtTwo = Math.sqrt(2);

const _props = defineProps<{
    node: BoardNode;
    nodeType: GenericNodeType;
    dragging?: BoardNode;
    dragged?: {
        x: number;
        y: number;
    };
    hasDragged?: boolean;
    receivingNode?: boolean;
    selectedNode?: BoardNode | null;
    selectedAction?: GenericBoardNodeAction | null;
}>();
const props = toRefs(_props);
const emit = defineEmits<{
    (e: "mouseDown", event: MouseEvent | TouchEvent, node: number, isDraggable: boolean): void;
    (e: "endDragging", node: number): void;
}>();

const isHovering = ref(false);
const isSelected = computed(() => unref(props.selectedNode) === unref(props.node));
const isDraggable = computed(() =>
    getNodeProperty(props.nodeType.value.draggable, unref(props.node))
);

watch(isDraggable, value => {
    const node = unref(props.node);
    if (unref(props.dragging) === node && !value) {
        emit("endDragging", node.id);
    }
});

const actions = computed(() => {
    const node = unref(props.node);
    return getNodeProperty(props.nodeType.value.actions, node)?.filter(
        action => getNodeProperty(action.visibility, node) !== Visibility.None
    );
});

const position = computed(() => {
    const node = unref(props.node);
    const dragged = unref(props.dragged);

    return getNodeProperty(props.nodeType.value.draggable, node) &&
        unref(props.dragging)?.id === node.id &&
        dragged
        ? {
              x: node.position.x + Math.round(dragged.x / 25) * 25,
              y: node.position.y + Math.round(dragged.y / 25) * 25
          }
        : node.position;
});

const shape = computed(() => getNodeProperty(props.nodeType.value.shape, unref(props.node)));
const title = computed(() => getNodeProperty(props.nodeType.value.title, unref(props.node)));
const label = computed(() => getNodeProperty(props.nodeType.value.label, unref(props.node)));
const size = computed(() => getNodeProperty(props.nodeType.value.size, unref(props.node)));
const progress = computed(
    () => getNodeProperty(props.nodeType.value.progress, unref(props.node)) || 0
);
const backgroundColor = computed(() => themes[settings.theme].variables["--background"]);
const outlineColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.outlineColor, unref(props.node)) ||
        themes[settings.theme].variables["--outline"]
);
const fillColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.fillColor, unref(props.node)) ||
        themes[settings.theme].variables["--raised-background"]
);
const progressColor = computed(() =>
    getNodeProperty(props.nodeType.value.progressColor, unref(props.node))
);
const titleColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.titleColor, unref(props.node)) ||
        themes[settings.theme].variables["--foreground"]
);
const progressDisplay = computed(() =>
    getNodeProperty(props.nodeType.value.progressDisplay, unref(props.node))
);
const canAccept = computed(
    () =>
        unref(props.dragging) != null &&
        unref(props.hasDragged) &&
        getNodeProperty(props.nodeType.value.canAccept, unref(props.node))
);
const actionDistance = computed(() =>
    getNodeProperty(props.nodeType.value.actionDistance, unref(props.node))
);

function mouseDown(e: MouseEvent | TouchEvent) {
    emit("mouseDown", e, props.node.value.id, isDraggable.value);
}

function mouseUp() {
    if (!props.hasDragged?.value) {
        props.nodeType.value.onClick?.(props.node.value);
    }
}

function performAction(e: MouseEvent | TouchEvent, action: GenericBoardNodeAction) {
    // If the onClick function made this action selected,
    // don't propagate the event (which will deselect everything)
    if (action.onClick(unref(props.node)) || unref(props.selectedAction)?.id === action.id) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function actionMouseUp(e: MouseEvent | TouchEvent, action: GenericBoardNodeAction) {
    if (unref(props.selectedAction)?.id === action.id) {
        e.preventDefault();
        e.stopPropagation();
    }
}
</script>

<style scoped>
.boardnode {
    cursor: pointer;
    transition-duration: 0s;
}

.node-title {
    text-anchor: middle;
    dominant-baseline: middle;
    font-family: monospace;
    font-size: 200%;
    pointer-events: none;
}

.progressRing {
    transform: rotate(-90deg);
}

.action:not(.boardnode):hover circle,
.action:not(.boardnode).selected circle {
    r: 25;
}

.action:not(.boardnode):hover text,
.action:not(.boardnode).selected text {
    font-size: 187.5%; /* 150% * 1.25 */
}

.action:not(.boardnode) text {
    text-anchor: middle;
    dominant-baseline: central;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>

<style>
.actions-enter-from .action,
.actions-leave-to .action {
    transform: translate(0, 0);
}

.grow-enter-from .node-container,
.grow-leave-to .node-container {
    transform: scale(0);
}
</style>
