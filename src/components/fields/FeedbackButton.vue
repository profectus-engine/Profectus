<template>
    <button @click.stop="click" class="feedback" :class="{ activated, left }">
        <slot />
    </button>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";

defineProps<{
    left?: boolean;
}>();
const emit = defineEmits<{
    (e: "click"): void;
}>();

const activated = ref(false);
const activatedTimeout = ref<number | null>(null);

function click() {
    emit("click");

    // Give feedback to user
    if (activatedTimeout.value) {
        clearTimeout(activatedTimeout.value);
    }
    activated.value = false;
    nextTick(() => {
        activated.value = true;
        activatedTimeout.value = setTimeout(() => (activated.value = false), 500);
    });
}
</script>

<style scoped>
.feedback {
    position: relative;
}

.feedback::after {
    position: absolute;
    left: calc(100% + 5px);
    top: 50%;
    transform: translateY(-50%);
    content: "✔";
    opacity: 0;
    pointer-events: none;
    box-shadow: inset 0 0 0 35px rgba(111, 148, 182, 0);
    text-shadow: none;
}

.feedback.left::after {
    left: unset;
    right: calc(100% + 5px);
}

.feedback.activated::after {
    animation: feedback 0.5s ease-out forwards;
}

@keyframes feedback {
    0% {
        opacity: 1;
        transform: scale3d(0.4, 0.4, 1), translateY(-50%);
    }
    80% {
        opacity: 0.1;
    }
    100% {
        opacity: 0;
        transform: scale3d(1.2, 1.2, 1), translateY(-50%);
    }
}
</style>
