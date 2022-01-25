<template>
    <button
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :class="{ feature: true, tile: true, can: canClick, locked: !canClick }"
        :style="style"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart="start"
        @touchend="stop"
        @touchcancel="stop"
        :disabled="!canClick"
    >
        <div v-if="title"><component :is="titleComponent" /></div>
        <component :is="component" style="white-space: pre-line" />
        <LinkNode :id="id" />
    </button>
</template>

<script setup lang="ts">
import { Visibility } from "@/features/feature";
import { GridCell } from "@/features/grid";
import { coerceComponent, setupHoldToClick } from "@/util/vue";
import { computed, toRefs, unref } from "vue";
import LinkNode from "../system/LinkNode.vue";

const props = toRefs(defineProps<GridCell>());

const { start, stop } = setupHoldToClick(props.onClick, props.onHold);

const titleComponent = computed(() => {
    const title = unref(props.title);
    return title && coerceComponent(title);
});
const component = computed(() => coerceComponent(unref(props.display)));
</script>

<style scoped>
.tile {
    min-height: 80px;
    width: 80px;
    font-size: 10px;
    background-color: var(--layer-color);
}
</style>
