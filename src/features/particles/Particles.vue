onMounted,
<template>
    <Particles
        :id="id"
        :class="{
            'not-fullscreen': !fullscreen
        }"
        :style="{
            zIndex
        }"
        ref="particles"
        :particlesInit="particlesInit"
        :particlesLoaded="particlesLoaded"
        :options="{
            fpsLimit: 60,
            fullScreen: { enable: fullscreen, zIndex },
            particles: {
                number: {
                    value: 0
                }
            },
            emitters: {
                autoPlay: false
            }
        }"
        v-bind="$attrs"
    />
    <div ref="resizeListener" class="resize-listener" />
</template>

<script lang="tsx">
import { loadFull } from "tsparticles";
import { Engine, Container } from "tsparticles-engine";
import { Emitters } from "tsparticles-plugin-emitters/Emitters";
import { EmitterContainer } from "tsparticles-plugin-emitters/EmitterContainer";
import { defineComponent, inject, nextTick, onMounted, PropType, ref } from "vue";
import { ParticlesComponent } from "particles.vue3";
import { FeatureNode, NodesInjectionKey } from "game/layers";

// TODO get typing support on the Particles component
export default defineComponent({
    props: {
        zIndex: {
            type: Number,
            required: true
        },
        fullscreen: {
            type: Boolean,
            required: true
        },
        onInit: {
            type: Function as PropType<(container: EmitterContainer & Container) => void>,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        onContainerResized: Function as PropType<(rect: DOMRect) => void>
    },
    components: { Particles: ParticlesComponent },
    setup(props) {
        const particles = ref<null | { particles: { container: Emitters } }>(null);

        async function particlesInit(engine: Engine) {
            await loadFull(engine);
        }

        function particlesLoaded(container: EmitterContainer & Container) {
            props.onInit(container);
        }

        const resizeObserver = new ResizeObserver(updateBounds);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const nodes = inject(NodesInjectionKey)!;

        const resizeListener = ref<Element | null>(null);

        onMounted(() => {
            // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
            const resListener = resizeListener.value;
            if (resListener != null) {
                resizeObserver.observe(resListener);
            }
            updateBounds();
        });

        let isDirty = true;
        function updateBounds() {
            if (isDirty) {
                isDirty = false;
                nextTick(() => {
                    if (resizeListener.value != null && props.onContainerResized) {
                        // TODO don't overlap with Links.vue
                        (Object.values(nodes.value) as FeatureNode[]).forEach(
                            node => (node.rect = node.element.getBoundingClientRect())
                        );
                        props.onContainerResized(resizeListener.value.getBoundingClientRect());
                    }
                    isDirty = true;
                });
            }
        }

        return {
            particles,
            particlesInit,
            particlesLoaded,
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
