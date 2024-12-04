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
import { nextTick, onBeforeUnmount, onMounted, shallowRef, unref } from "vue";
import type { Particles } from "./particles";

const props = defineProps<{
    onContainerResized: Particles["onContainerResized"];
    onHotReload: Particles["onHotReload"];
    onInit: (app: Application) => void;
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
        props.onInit(app.value);
    }
    updateBounds();
    if (props.onHotReload) {
        nextTick(props.onHotReload);
    }
});
onBeforeUnmount(() => {
    app.value?.destroy();
});

let isDirty = true;
function updateBounds() {
    if (isDirty) {
        isDirty = false;
        nextTick(() => {
            if (resizeListener.value != null) {
                props.onContainerResized?.(resizeListener.value.getBoundingClientRect());
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
