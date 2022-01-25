<template>
    <span class="container" :class="{ confirming: isConfirming }">
        <span v-if="isConfirming">Are you sure?</span>
        <button @click.stop="click" class="button danger" :disabled="disabled">
            <span v-if="isConfirming">Yes</span>
            <slot v-else />
        </button>
        <button v-if="isConfirming" class="button" @click.stop="cancel">No</button>
    </span>
</template>

<script setup lang="ts">
import { ref, toRefs, unref, watch } from "vue";

const _props = defineProps<{
    disabled?: boolean;
    skipConfirm?: boolean;
}>();
const props = toRefs(_props);
const emit = defineEmits<{
    (e: "click"): void;
    (e: "confirmingChanged", value: boolean): void;
}>();

const isConfirming = ref(false);

watch(isConfirming, isConfirming => {
    emit("confirmingChanged", isConfirming);
});

function click() {
    if (unref(props.skipConfirm)) {
        emit("click");
        return;
    }
    if (isConfirming.value) {
        emit("click");
    }
    isConfirming.value = !isConfirming.value;
}

function cancel() {
    isConfirming.value = false;
}
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    background: var(--raised-background);
    box-shadow: var(--raised-background) 0 2px 3px 5px;
}

.container.confirming button {
    font-size: 1em;
}

.container > * {
    margin: 0 4px;
}
</style>

<style>
.danger,
.button.danger {
    position: relative;
    border: solid 2px var(--danger);
    border-right-width: 16px;
}

.danger::after {
    position: absolute;
    content: "!";
    color: white;
    right: -13px;
}
</style>
