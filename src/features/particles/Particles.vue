<template>
    <div
        ref="resizeListener"
        class="resize-listener"
        :style="unref(style)"
        :class="unref(classes)"
    />
</template>

<script setup lang="tsx">
import { Application } from "@pixi/app";
import type { StyleValue } from "features/feature";
import { globalBus } from "game/events";
import "lib/pixi";
import { nextTick, onBeforeUnmount, onMounted, shallowRef, unref } from "vue";

const props = defineProps<{
    style?: StyleValue;
    classes?: Record<string, boolean>;
    onInit: (app: Application) => void;
    id: string;
    onContainerResized?: (rect: DOMRect) => void;
    onHotReload?: VoidFunction;
}>();

const app = shallowRef<null | Application>(null);

const resizeObserver = new ResizeObserver(updateBounds);
const resizeListener = shallowRef<HTMLElement | null>(null);

onMounted(() => {
    // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
        app.value = new Application({
            resizeTo: resListener,
            backgroundAlpha: 0
        });
        resizeListener.value?.appendChild(app.value.view);
        props.onInit?.(app.value as Application);
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
