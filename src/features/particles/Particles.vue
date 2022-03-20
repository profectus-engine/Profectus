<template>
    <Particles
        id="particles"
        ref="particles"
        :particlesInit="particlesInit"
        :options="{
            fpsLimit: 60,
            fullScreen: { zIndex: 1 },
            particles: {
                number: {
                    value: 0
                }
            },
            emitters: {
                autoPlay: false
            }
        }"
    />
</template>

<script lang="tsx">
import { loadFull } from "tsparticles";
import { Engine } from "tsparticles-engine";
import { Emitters } from "tsparticles-plugin-emitters/Emitters";
import { defineComponent, nextTick, ref } from "vue";
import { ParticlesComponent } from "particles.vue3";

// TODO get typing support on the Particles component
export default defineComponent({
    emits: ["init"],
    components: { Particles: ParticlesComponent },
    setup(props, { emit }) {
        const particles = ref<null | { particles: { container: Emitters } }>(null);

        async function particlesInit(engine: Engine) {
            await loadFull(engine);
            finishInit(engine);
        }

        function finishInit(engine: Engine) {
            if (engine.domArray.length) {
                emit("init", engine.domItem(0));
            } else {
                nextTick(() => finishInit(engine));
            }
        }

        return {
            particles,
            particlesInit
        };
    }
});
</script>
