<template>
    <button
        @click="e => emits('click', e)"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
        :class="{
            clickable: true,
            can: unref(canClick),
            locked: !unref(canClick)
        }"
        :disabled="!unref(canClick)"
    >
        <Component />
    </button>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import { MaybeGetter } from "util/computed";
import {
    render,
    Renderable,
    setupHoldToClick
} from "util/vue";
import type { Component, MaybeRef } from "vue";
import { unref } from "vue";

const props = defineProps<{
    canClick: MaybeRef<boolean>;
    display?: MaybeGetter<Renderable>;
}>();

const emits = defineEmits<{
    (e: "click", event?: MouseEvent | TouchEvent): void;
    (e: "hold"): void;
}>();

const Component = () => props.display == null ? <></> : render(props.display);

const { start, stop } = setupHoldToClick(() => emits("hold"));
</script>

<style scoped>
.clickable {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}

.clickable > * {
    pointer-events: none;
}
</style>
