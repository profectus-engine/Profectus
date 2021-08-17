<template>
    <button
        v-if="upgrade.unlocked"
        :style="style"
        @click="buy"
        :class="{
            feature: true,
            [layer]: true,
            upgrade: true,
            can: upgrade.canAfford && !upgrade.bought,
            locked: !upgrade.canAfford && !upgrade.bought,
            bought: upgrade.bought
        }"
        :disabled="!upgrade.canAfford && !upgrade.bought"
    >
        <component v-if="fullDisplay" :is="fullDisplay" />
        <default-upgrade-display v-else :id="id" />
        <branch-node :branches="upgrade.branches" :id="id" featureType="upgrade" />
    </button>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Upgrade } from "@/typings/features/upgrade";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "upgrade",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        upgrade(): Upgrade {
            return layers[this.layer].upgrades!.data[this.id];
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.upgrade.canAfford && !this.upgrade.bought
                    ? { backgroundColor: layers[this.layer].color }
                    : undefined,
                layers[this.layer].componentStyles?.upgrade,
                this.upgrade.style
            ];
        },
        fullDisplay(): Component | string | null {
            if (this.upgrade.fullDisplay) {
                return coerceComponent(this.upgrade.fullDisplay, "div");
            }
            return null;
        }
    },
    methods: {
        buy() {
            this.upgrade.buy();
        }
    }
});
</script>

<style scoped>
.upgrade {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}
</style>
