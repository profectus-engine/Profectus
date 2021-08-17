<template>
    <button
        @click="press"
        :class="{ feature: true, can: unlocked, locked: !unlocked }"
        :style="style"
    >
        <component :is="masterButtonDisplay" />
    </button>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { CoercableComponent } from "@/typings/component";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent, PropType } from "vue";

export default defineComponent({
    name: "master-button",
    mixins: [InjectLayerMixin],
    props: {
        display: [String, Object] as PropType<CoercableComponent>
    },
    emits: ["press"],
    computed: {
        style(): Partial<CSSStyleDeclaration> | undefined {
            return layers[this.layer].componentStyles?.["master-button"];
        },
        unlocked(): boolean {
            return player.layers[this.layer].unlocked;
        },
        masterButtonDisplay(): Component | string {
            if (this.display) {
                return coerceComponent(this.display);
            }
            if (layers[this.layer].clickables?.masterButtonDisplay) {
                return coerceComponent(layers[this.layer].clickables!.masterButtonDisplay!);
            }
            return coerceComponent("Click Me!");
        }
    },
    methods: {
        press() {
            this.$emit("press");
        }
    }
});
</script>

<style scoped></style>
