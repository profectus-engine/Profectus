<template>
    <panZoom
        selector=".stage"
        :options="{ initialZoom: 1, minZoom: 0.1, maxZoom: 10, zoomDoubleClickSpeed: 1 }"
        ref="stage"
        @init="onInit"
        @mousemove="(e: MouseEvent) => emit('drag', e)"
        @touchmove="(e: TouchEvent) => emit('drag', e)"
        @mouseleave="(e: MouseEvent) => emit('mouseLeave', e)"
        @mouseup="(e: MouseEvent) => emit('mouseUp', e)"
        @touchend.passive="(e: TouchEvent) => emit('mouseUp', e)"
    >
        <div
            class="event-listener"
            @mousedown="(e: MouseEvent) => emit('mouseDown', e)"
            @touchstart="(e: TouchEvent) => emit('mouseDown', e)"
        />
        <div class="stage">
            <slot />
        </div>
    </panZoom>
</template>

<script setup lang="ts">
import type { PanZoom } from "panzoom";
import type { ComponentPublicInstance } from "vue";
import { computed, ref } from "vue";
// Required to make sure panzoom component gets registered:
import "./board";

defineExpose({
    panZoomInstance: computed(() => stage.value?.panZoomInstance)
});
const emit = defineEmits<{
    (event: "drag", e: MouseEvent | TouchEvent): void;
    (event: "mouseDown", e: MouseEvent | TouchEvent): void;
    (event: "mouseUp", e: MouseEvent | TouchEvent): void;
    (event: "mouseLeave", e: MouseEvent | TouchEvent): void;
}>();

const stage = ref<{ panZoomInstance: PanZoom } & ComponentPublicInstance<HTMLElement>>();

function onInit(panzoomInstance: PanZoom) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    panzoomInstance.setTransformOrigin(null);
    panzoomInstance.moveTo(0, stage.value?.$el.clientHeight / 2);
}
</script>

<style scoped>
.event-listener {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.stage {
    transition-duration: 0s;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>

<style>
.vue-pan-zoom-item {
    overflow: hidden;
}

.vue-pan-zoom-scene {
    width: 100%;
    height: 100%;
    cursor: grab;
}

.vue-pan-zoom-scene:active {
    cursor: grabbing;
}

.stage > * {
    pointer-events: initial;
}

/* "Only" child (excluding resize listener) */
.layer-tab > .vue-pan-zoom-item:first-child:nth-last-child(2) {
    width: calc(100% + 20px);
    height: calc(100% + 100px);
    margin: -50px -10px;
}

.board-node {
    position: absolute;
    top: 0;
    left: 50%;
    transition-duration: 0s;
}
</style>
game/boards/board
