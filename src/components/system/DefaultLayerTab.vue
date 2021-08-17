<template>
    <infobox v-if="infobox != undefined" :id="infobox" />
    <main-display />
    <sticky v-if="showPrestigeButton"><prestige-button /></sticky>
    <resource-display />
    <milestones />
    <component v-if="midsection" :is="midsection" />
    <clickables />
    <buyables />
    <upgrades />
    <challenges />
    <achievements />
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "default-layer-tab",
    mixins: [InjectLayerMixin],
    computed: {
        infobox(): string | undefined {
            return (
                layers[this.layer].infoboxes && Object.keys(layers[this.layer].infoboxes!.data)[0]
            );
        },
        midsection(): Component | string | null {
            if (layers[this.layer].midsection) {
                return coerceComponent(layers[this.layer].midsection!);
            }
            return null;
        },
        showPrestigeButton(): boolean {
            return layers[this.layer].type !== "none";
        }
    }
});
</script>

<style scoped></style>
