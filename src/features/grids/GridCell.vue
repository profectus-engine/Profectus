<template>
    <button
        :class="{ tile: true, can: unref(canClick), locked: !unref(canClick) }"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
    >
        <div v-if="title"><Title /></div>
        <Component style="white-space: pre-line" />
    </button>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import {
    render,
    setupHoldToClick
} from "util/vue";
import { toRef, unref } from "vue";
import { GridCell } from "./grid";

const props = defineProps<{
    onClick: GridCell["onClick"];
    onHold: GridCell["onHold"];
    display: GridCell["display"];
    title: GridCell["title"];
    canClick: GridCell["canClick"];
}>();

const { start, stop } = setupHoldToClick(toRef(props, "onClick"), toRef(props, "onHold"));

const Title = () => props.title == null ? <></> : render(props.title);
const Component = () => render(props.display);
</script>

<style scoped>
.tile {
    min-height: 80px;
    width: 80px;
    font-size: 10px;
    background-color: var(--layer-color);
}

.tile > * {
    pointer-events: none;
}
</style>
