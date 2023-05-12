<template>
    <!-- Ugly casting to prevent TS compiler error about style because vue doesn't think it supports arrays when it does -->
    <g
        class="boardnode"
        :class="{ [node.type]: true, isSelected, isDraggable, ...classes }"
        :style="[{ opacity: dragging?.id === node.id && hasDragged ? 0.5 : 1 }, style ?? []] as unknown as (string | CSSProperties)"
        :transform="`translate(${position.x},${position.y})${isSelected ? ' scale(1.2)' : ''}`"
    >
        <BoardNodeAction
            :actions="actions ?? []"
            :is-selected="isSelected"
            :node="node"
            :node-type="nodeType"
            :selected-action="selectedAction"
            @click-action="(actionId: string) => emit('clickAction', actionId)"
        />

        <g
            class="node-container"
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
                    class="progress progressFill"
                    v-if="progressDisplay === ProgressDisplay.Fill"
                    :r="Math.max(size * progress - 2, 0)"
                    :fill="progressColor"
                />
                <circle
                    v-else
                    :r="size + 4.5"
                    class="progress progressRing"
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
                    class="progress progressFill"
                    :width="Math.max(size * sqrtTwo * progress - 2, 0)"
                    :height="Math.max(size * sqrtTwo * progress - 2, 0)"
                    :transform="`translate(${-Math.max(size * sqrtTwo * progress - 2, 0) / 2}, ${
                        -Math.max(size * sqrtTwo * progress - 2, 0) / 2
                    })`"
                    :fill="progressColor"
                />
                <rect
                    v-else
                    class="progress progressDiamond"
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
                    :fill="label.color ?? titleColor"
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
                :fill="confirmationLabel.color ?? titleColor"
                class="node-title"
                :class="{ pulsing: confirmationLabel.pulsing }"
                :y="size + 75"
                >{{ confirmationLabel.text }}</text
            >
        </transition>
    </g>
</template>

<script setup lang="ts">
import themes from "data/themes";
import type { BoardNode, GenericBoardNodeAction, GenericNodeType } from "features/boards/board";
import { ProgressDisplay, Shape, getNodeProperty } from "features/boards/board";
import { isVisible } from "features/feature";
import settings from "game/settings";
import { CSSProperties, computed, toRefs, unref, watch } from "vue";
import BoardNodeAction from "./BoardNodeAction.vue";

const sqrtTwo = Math.sqrt(2);

const _props = defineProps<{
    node: BoardNode;
    nodeType: GenericNodeType;
    dragging: BoardNode | null;
    dragged?: {
        x: number;
        y: number;
    };
    hasDragged?: boolean;
    receivingNode?: boolean;
    isSelected: boolean;
    selectedAction: GenericBoardNodeAction | null;
}>();
const props = toRefs(_props);
const emit = defineEmits<{
    (e: "mouseDown", event: MouseEvent | TouchEvent, node: BoardNode, isDraggable: boolean): void;
    (e: "endDragging", node: BoardNode): void;
    (e: "clickAction", actionId: string): void;
}>();

const isDraggable = computed(() =>
    getNodeProperty(props.nodeType.value.draggable, unref(props.node))
);

watch(isDraggable, value => {
    const node = unref(props.node);
    if (unref(props.dragging) === node && !value) {
        emit("endDragging", node);
    }
});

const actions = computed(() => {
    const node = unref(props.node);
    return getNodeProperty(props.nodeType.value.actions, node)?.filter(action =>
        isVisible(getNodeProperty(action.visibility, node))
    );
});

const position = computed(() => {
    const node = unref(props.node);

    if (
        getNodeProperty(props.nodeType.value.draggable, node) &&
        unref(props.dragging)?.id === node.id &&
        unref(props.dragged) != null
    ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { x, y } = unref(props.dragged)!;
        return {
            x: node.position.x + Math.round(x / 25) * 25,
            y: node.position.y + Math.round(y / 25) * 25
        };
    }
    return node.position;
});

const shape = computed(() => getNodeProperty(props.nodeType.value.shape, unref(props.node)));
const title = computed(() => getNodeProperty(props.nodeType.value.title, unref(props.node)));
const label = computed(
    () =>
        (props.isSelected.value
            ? unref(props.selectedAction) &&
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              getNodeProperty(unref(props.selectedAction)!.tooltip, unref(props.node))
            : null) ?? getNodeProperty(props.nodeType.value.label, unref(props.node))
);
const confirmationLabel = computed(() =>
    getNodeProperty(
        unref(props.selectedAction)?.confirmationLabel ?? {
            text: "Tap again to confirm"
        },
        unref(props.node)
    )
);
const size = computed(() => getNodeProperty(props.nodeType.value.size, unref(props.node)));
const progress = computed(
    () => getNodeProperty(props.nodeType.value.progress, unref(props.node)) ?? 0
);
const backgroundColor = computed(() => themes[settings.theme].variables["--background"]);
const outlineColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.outlineColor, unref(props.node)) ??
        themes[settings.theme].variables["--outline"]
);
const fillColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.fillColor, unref(props.node)) ??
        themes[settings.theme].variables["--raised-background"]
);
const progressColor = computed(() =>
    getNodeProperty(props.nodeType.value.progressColor, unref(props.node))
);
const titleColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.titleColor, unref(props.node)) ??
        themes[settings.theme].variables["--foreground"]
);
const progressDisplay = computed(() =>
    getNodeProperty(props.nodeType.value.progressDisplay, unref(props.node))
);
const canAccept = computed(
    () =>
        props.dragging.value != null &&
        unref(props.hasDragged) &&
        getNodeProperty(props.nodeType.value.canAccept, unref(props.node), props.dragging.value)
);
const style = computed(() => getNodeProperty(props.nodeType.value.style, unref(props.node)));
const classes = computed(() => getNodeProperty(props.nodeType.value.classes, unref(props.node)));

function mouseDown(e: MouseEvent | TouchEvent) {
    emit("mouseDown", e, props.node.value, isDraggable.value);
}

function mouseUp(e: MouseEvent | TouchEvent) {
    if (!props.hasDragged?.value) {
        emit("endDragging", props.node.value);
        props.nodeType.value.onClick?.(props.node.value);
        e.stopPropagation();
    }
}
</script>

<style scoped>
.boardnode {
    cursor: pointer;
    transition-duration: 0s;
}

.boardnode:hover .body {
    fill: var(--highlighted);
}

.boardnode.isSelected .body {
    fill: var(--accent1) !important;
}

.boardnode:not(.isDraggable) .body {
    fill: var(--locked);
}

.node-title {
    text-anchor: middle;
    dominant-baseline: middle;
    font-family: monospace;
    font-size: 200%;
    pointer-events: none;
    filter: drop-shadow(3px 3px 2px var(--tooltip-background));
}

.progress {
    transition-duration: 0.05s;
}

.progressRing {
    transform: rotate(-90deg);
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
.grow-enter-from .node-container,
.grow-leave-to .node-container {
    transform: scale(0);
}
</style>
