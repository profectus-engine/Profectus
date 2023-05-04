<template>
    <div
        ref="resizeListener"
        class="resize-listener"
        :style="unref(style)"
        :class="unref(classes)"
    />
</template>

<script lang="tsx">
import { Application } from "@pixi/app";
import type { StyleValue } from "features/feature";
import { globalBus } from "game/events";
import "lib/pixi";
import { processedPropType } from "util/vue";
import type { PropType } from "vue";
import { defineComponent, nextTick, onBeforeUnmount, onMounted, shallowRef, unref } from "vue";

// TODO get typing support on the Particles component
export default defineComponent({
    props: {
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        onInit: {
            type: Function as PropType<(app: Application) => void>,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        onContainerResized: Function as PropType<(rect: DOMRect) => void>,
        onHotReload: Function as PropType<VoidFunction>
    },
    setup(props) {
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
                // I think it's supporsed to be a canvas element
                resizeListener.value?.appendChild(app.value.view as HTMLCanvasElement);
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

        return {
            unref,
            resizeListener
        };
    }
});
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
