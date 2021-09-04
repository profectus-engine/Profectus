<template>
    <slot />
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";

export default defineComponent({
    name: "LayerProvider",
    provide() {
        return {
            tab: reactive({
                layer: this.layer,
                index: this.index
            })
        };
    },
    props: {
        layer: String,
        index: Number
    },
    watch: {
        layer(layer) {
            this.$.provides.tab.layer = layer;
        },
        index(index) {
            this.$.provides.tab.index = index;
        }
    }
});
</script>

<style scoped></style>
