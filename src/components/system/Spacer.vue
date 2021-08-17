<template>
    <div :style="{ width: spacingWidth, height: spacingHeight }"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "spacer",
    props: {
        width: String,
        height: String
    },
    computed: {
        spacingWidth(): string {
            return this.width || "8px";
        },
        spacingHeight(): string {
            return this.height || "17px";
        }
    }
});
</script>
