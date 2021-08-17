<template>
    <LayerProvider :layer="layer" :index="tab.index">
        <component :is="display" />
    </LayerProvider>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "subtab",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        display(): Component | string | undefined {
            return (
                layers[this.layer].subtabs![this.id].display &&
                coerceComponent(layers[this.layer].subtabs![this.id].display!)
            );
        }
    }
});
</script>

<style scoped></style>
