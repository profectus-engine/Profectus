<template>
    <div :style="{ width, height }"></div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        width?: string;
        height?: string;
    }>(),
    {
        width: "8px",
        height: "17px"
    }
);
</script>
