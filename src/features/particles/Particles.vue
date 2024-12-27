<template>
    <div
        ref="resizeListener"
        class="resize-listener"
    />
</template>

<script setup lang="tsx">
import { Application } from "@pixi/app";
import { globalBus } from "game/events";
import "lib/pixi";
import { nextTick, onBeforeUnmount, onMounted, shallowRef } from "vue";

const emits = defineEmits<{
    (e: "containerResized", boundingRect: DOMRect): void;
    (e: "hotReload"): void;
    (e: "init", app: Application): void;
}>();

const app = shallowRef<null | Application>(null);

const resizeObserver = new ResizeObserver(updateBounds);
const resizeListener = shallowRef<HTMLElement | null>(null);

onMounted(() => {
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
        app.value = new Application({
            resizeTo: resListener,
            backgroundAlpha: 0
        });
        resizeListener.value?.appendChild(app.value.view);
        emits("init", app.value);
    }
    updateBounds();
    nextTick(() => emits("hotReload"));
});
onBeforeUnmount(() => {
    app.value?.destroy();
    app.value = null;
});

let isDirty = true;
function updateBounds() {
    if (isDirty) {
        isDirty = false;
        nextTick(() => {
            if (resizeListener.value != null) {
                emits("containerResized", resizeListener.value.getBoundingClientRect());
            }
            isDirty = true;
        });
    }
}
globalBus.on("fontsLoaded", updateBounds);
</script>

<style scoped>
.not-fullscreen,
.resize-listener {
    position: absolute;
    top: 0px;
    left: 0;
    right: -4px;
    bottom: 5px;
    pointer-events: none;
}
</style>
