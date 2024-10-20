<template>
    <div
        v-if="isVisible(visibility)"
        :style="{ visibility: isHidden(visibility) ? 'hidden' : undefined }"
        :class="{
            treeNode: true,
            can: unref(canClick),
            ...unref(classes)
        }"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
    >
        <div
            :style="[
                {
                    backgroundColor: unref(color),
                    boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 20px ${unref(
                        glowColor
                    )}`
                },
                unref(style) ?? []
            ]"
        >
            <component :is="unref(comp)" />
        </div>
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script setup lang="ts">
import type { CoercableComponent, StyleValue, Visibility } from "features/feature";
import { isHidden, isVisible } from "features/feature";
import {
    computeOptionalComponent,
    setupHoldToClick
} from "util/vue";
import { toRef, unref } from "vue";

const props = defineProps<{
    visibility: Visibility | boolean;
    canClick: boolean;
    id: string;
    display?: CoercableComponent;
    style?: StyleValue;
    classes?: Record<string, boolean>;
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    onHold?: VoidFunction;
    color?: string;
    glowColor?: string;
    mark?: boolean | string;
}>();

const comp = computeOptionalComponent(toRef(props, "display"));

const { start, stop } = setupHoldToClick(toRef(props, "onClick"), toRef(props, "onHold"));
</script>

<style scoped>
.treeNode {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    padding: 0;
    margin: 0 10px 0 10px;
}

.treeNode > *:first-child {
    width: 100%;
    height: 100%;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
    display: flex;
}

.treeNode > *:first-child > * {
    pointer-events: none;
}
</style>
