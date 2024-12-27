<template>
    <div
        class="board-node"
        :style="`transform: translate(calc(${unref(position).x}px - 50%), ${unref(position).y}px);`"
        @click.capture.stop="() => {}"
        @mousedown="e => emits('mouseDown', e)"
        @touchstart.passive="e => emits('mouseDown', e)"
        @mouseup.capture="e => emits('mouseUp', e)"
        @touchend.passive="e => emits('mouseUp', e)"
    >
        <slot />
    </div>
</template>

<script setup lang="tsx">
import { Ref, unref } from "vue";
import { NodePosition } from "./board";

defineProps<{
    position: Ref<NodePosition>;
}>();

const emits = defineEmits<{
    (e: "mouseDown", event: MouseEvent | TouchEvent): void;
    (e: "mouseUp", event: MouseEvent | TouchEvent): void;
}>();
</script>
