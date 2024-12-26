<template>
    <rect
        :width="size"
        :height="size"
        :transform="`translate(${-size / 2}, ${-size / 2})`"
        fill="transparent"
        :stroke-dasharray="size * 4"
        :stroke-width="5"
        :stroke-dashoffset="size * 4 - progress * size * 4"
        :stroke="stroke"
    />
</template>

<script setup lang="ts">
import type { SVGAttributes } from "vue";

interface SquareProgressProps extends /* @vue-ignore */ SVGAttributes {
    size: number;
    progress: number;
    stroke: string;
}

defineProps<SquareProgressProps>();
</script>

<style scoped>
rect {
    transition-duration: 0.05s;
}
</style>
