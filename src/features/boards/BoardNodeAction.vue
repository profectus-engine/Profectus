<template>
    <transition name="actions" appear>
        <g v-if="isSelected && actions">
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
</template>

<script setup lang="ts">
import themes from "data/themes";
import type { BoardNode, GenericBoardNodeAction, GenericNodeType } from "features/boards/board";
import { getNodeProperty } from "features/boards/board";
import settings from "game/settings";
import { computed, toRefs, unref } from "vue";

const _props = defineProps<{
    node: BoardNode;
    nodeType: GenericNodeType;
    actions?: GenericBoardNodeAction[];
    isSelected: boolean;
    selectedAction: GenericBoardNodeAction | null;
}>();
const props = toRefs(_props);

const emit = defineEmits<{
    (e: "clickAction", actionId: string): void;
}>();

const size = computed(() => getNodeProperty(props.nodeType.value.size, unref(props.node)));
const outlineColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.outlineColor, unref(props.node)) ??
        themes[settings.theme].variables["--outline"]
);
const titleColor = computed(
    () =>
        getNodeProperty(props.nodeType.value.titleColor, unref(props.node)) ??
        themes[settings.theme].variables["--foreground"]
);
const actionDistance = computed(() =>
    getNodeProperty(props.nodeType.value.actionDistance, unref(props.node))
);

function performAction(e: MouseEvent | TouchEvent, action: GenericBoardNodeAction) {
    emit("clickAction", action.id);
    e.preventDefault();
    e.stopPropagation();
}

function actionMouseUp(e: MouseEvent | TouchEvent, action: GenericBoardNodeAction) {
    if (unref(props.selectedAction)?.id === action.id) {
        e.preventDefault();
        e.stopPropagation();
    }
}
</script>

<style scoped>
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
</style>

<style>
.actions-enter-from .action,
.actions-leave-to .action {
    transform: translate(0, 0);
}
</style>
