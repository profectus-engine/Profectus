<template>
    <div class="vr" :style="{ height }"></div>
</template>

<script setup lang="ts">
defineProps<{
    height?: string;
}>();
</script>

<style scoped>
.vr {
    width: 4px;
    background: var(--outline);
    height: 100%;
    margin: auto var(--feature-margin);
}
</style>
