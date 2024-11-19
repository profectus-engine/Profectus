<template>
    <div
        class="board-node"
        :style="`transform: translate(calc(${unref(position).x}px - 50%), ${unref(position).y}px);`"
        @mousedown="e => mouseDown(e)"
        @touchstart.passive="e => mouseDown(e)"
        @mouseup="e => mouseUp(e)"
        @touchend.passive="e => mouseUp(e)"
    >
        <slot />
    </div>
</template>

<script setup lang="tsx">
import { Ref, unref } from "vue";
import { NodePosition } from "./board";

defineProps<{
    mouseDown: (e: MouseEvent | TouchEvent) => void;
    mouseUp: (e: MouseEvent | TouchEvent) => void;
    position: Ref<NodePosition>;
}>();
</script>
