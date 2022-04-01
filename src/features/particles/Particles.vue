onMounted,
<template>
    <div
        ref="resizeListener"
        class="resize-listener"
        :style="unref(style)"
        :class="unref(classes)"
    />
</template>

<script lang="tsx">
import { StyleValue } from "features/feature";
import { FeatureNode, NodesInjectionKey } from "game/layers";
import { Application } from "pixi.js";
import { processedPropType } from "util/vue";
import {
    defineComponent,
    inject,
    nextTick,
    onBeforeUnmount,
    onMounted,
    PropType,
    ref,
    unref
} from "vue";

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
        const app = ref<null | Application>(null);

        const resizeObserver = new ResizeObserver(updateBounds);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const nodes = inject(NodesInjectionKey)!;

        const resizeListener = ref<HTMLElement | null>(null);

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
                props.onInit(app.value as Application);
            }
            updateBounds();
            if (module.hot?.status() === "apply" && props.onHotReload) {
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
                    if (resizeListener.value != null && props.onContainerResized) {
                        // TODO don't overlap with Links.vue
                        (Object.values(nodes.value).filter(n => n) as FeatureNode[]).forEach(
                            node => (node.rect = node.element.getBoundingClientRect())
                        );
                        props.onContainerResized(resizeListener.value.getBoundingClientRect());
                        app.value?.resize();
                    }
                    isDirty = true;
                });
            }
        }
        document.fonts.ready.then(updateBounds);

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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}
</style>
