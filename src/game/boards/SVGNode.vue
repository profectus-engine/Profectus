<template>
    <svg
        @mousedown="e => emit('mouseDown', e)"
        @touchstart.passive="e => emit('mouseDown', e)"
        @mouseup="e => emit('mouseUp', e)"
        @touchend.passive="e => emit('mouseUp', e)"
        width="1"
        height="1"
    >
        <slot />
    </svg>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    (e: "mouseDown", event: MouseEvent | TouchEvent): void;
    (e: "mouseUp", event: MouseEvent | TouchEvent): void;
}>();
</script>

<style scoped>
svg {
    cursor: pointer;
    transition-duration: 0s;
    overflow: visible;
    position: absolute;
}
</style>
