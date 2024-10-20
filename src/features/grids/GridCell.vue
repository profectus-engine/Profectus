<template>
    <button
        v-if="isVisible(visibility)"
        :class="{ feature: true, tile: true, can: unref(canClick), locked: !unref(canClick) }"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
    >
        <div v-if="title"><component :is="titleComponent" /></div>
        <component :is="component" style="white-space: pre-line" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="ts">
import "components/common/features.css";
import Node from "components/Node.vue";
import type { CoercableComponent, StyleValue } from "features/feature";
import { isHidden, isVisible, Visibility } from "features/feature";
import {
    computeComponent,
    computeOptionalComponent,
    setupHoldToClick
} from "util/vue";
import { toRef, unref } from "vue";

const props = defineProps<{
    visibility: Visibility | boolean;
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    onHold?: VoidFunction;
    display: CoercableComponent;
    title?: CoercableComponent;
    style?: StyleValue;
    canClick: boolean;
    id: string;
}>();


const { start, stop } = setupHoldToClick(toRef(props, "onClick"), toRef(props, "onHold"));

const titleComponent = computeOptionalComponent(toRef(props, "title"));
const component = computeComponent(toRef(props, "display"));
</script>

<style scoped>
.tile {
    min-height: 80px;
    width: 80px;
    font-size: 10px;
    background-color: var(--layer-color);
}

.tile > * {
    pointer-events: none;
}
</style>
