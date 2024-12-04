<template>
    <circle
        :r="r"
        fill="transparent"
        :stroke-dasharray="r * 2 * Math.PI"
        :stroke-width="5"
        :stroke-dashoffset="r * 2 * Math.PI - progress * r * 2 * Math.PI"
        :stroke="stroke"
    />
</template>

<script setup lang="ts">
import type { SVGAttributes } from "vue";

interface CircleProgressProps extends /* @vue-ignore */ SVGAttributes {
    r: number;
    progress: number;
    stroke: string;
}

defineProps<CircleProgressProps>();
</script>

<style scoped>
circle {
    transition-duration: 0.05s;
    transform: rotate(-90deg);
}
</style>
