<template>
    <button
        :style="style"
        @click="resetLayer"
        :class="{ [layer]: true, reset: true, locked: !canReset, can: canReset }"
    >
        <component v-if="prestigeButtonDisplay" :is="prestigeButtonDisplay" />
        <default-prestige-button-display v-else />
    </button>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { resetLayer } from "@/util/layers";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "prestige-button",
    mixins: [InjectLayerMixin],
    computed: {
        canReset(): boolean {
            return layers[this.layer].canReset;
        },
        color(): string {
            return layers[this.layer].color;
        },
        prestigeButtonDisplay(): Component | string | null {
            if (layers[this.layer].prestigeButtonDisplay) {
                return coerceComponent(layers[this.layer].prestigeButtonDisplay!);
            }
            return null;
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.canReset ? { backgroundColor: this.color } : undefined,
                layers[this.layer].componentStyles?.["prestige-button"]
            ];
        }
    },
    methods: {
        resetLayer() {
            resetLayer(this.layer);
        }
    }
});
</script>

<style scoped>
.reset {
    min-height: 100px;
    width: 180px;
    border-radius: var(--border-radius);
    border: 4px solid rgba(0, 0, 0, 0.125);
    margin: 10px;
}
</style>
