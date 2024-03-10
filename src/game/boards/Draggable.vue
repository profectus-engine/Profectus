<template>
    <div
        :style="`transform: translate(calc(${unref(position).x}px - 50%), ${unref(position).y}px);`"
        @mousedown="e => mouseDown(e)"
        @touchstart.passive="e => mouseDown(e)"
        @mouseup="e => mouseUp(e)"
        @touchend.passive="e => mouseUp(e)"
    >
        <component v-if="comp" :is="comp" />
    </div>
</template>

<script setup lang="tsx">
import { jsx } from "features/feature";
import { VueFeature, coerceComponent, renderJSX } from "util/vue";
import { Ref, shallowRef, unref } from "vue";
import { NodePosition } from "./board";
unref;

const props = defineProps<{
    element: VueFeature;
    mouseDown: (e: MouseEvent | TouchEvent) => void;
    mouseUp: (e: MouseEvent | TouchEvent) => void;
    position: Ref<NodePosition>;
}>();

const comp = shallowRef(coerceComponent(jsx(() => renderJSX(props.element))));
</script>

<style scoped>
div {
    position: absolute;
    top: 0;
    left: 50%;
    transition-duration: 0s;
}
</style>
