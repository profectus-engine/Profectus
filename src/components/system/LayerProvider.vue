<template>
    <slot />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "LayerProvider",
    provide() {
        return {
            tab: {
                layer: this.layer,
                index: this.index
            }
        };
    },
    props: {
        layer: String,
        index: Number
    }
});
</script>

<style scoped></style>
