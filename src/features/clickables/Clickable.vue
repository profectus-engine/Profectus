<template>
    <button
        @click="onClick"
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
import type { Clickable } from "features/clickables/clickable";
import {
    render,
    setupHoldToClick
} from "util/vue";
import type { Component } from "vue";
import { toRef, unref } from "vue";

const props = defineProps<{
    canClick: Clickable["canClick"];
    onClick: Clickable["onClick"];
    onHold?: Clickable["onHold"];
    display: Clickable["display"];
}>();

const Component = () => props.display == null ? <></> : render(props.display);

const { start, stop } = setupHoldToClick(toRef(props, "onClick"), toRef(props, "onHold"));
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
