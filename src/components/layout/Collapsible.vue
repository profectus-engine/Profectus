<template>
    <Col class="collapsible-container">
        <button @click="collapsed.value = !collapsed.value" class="feature collapsible-toggle">
            <component :is="displayComponent" />
        </button>
        <component v-if="!collapsed.value" :is="contentComponent" />
    </Col>
</template>

<script setup lang="ts">
import type { CoercableComponent } from "features/feature";
import { computeComponent } from "util/vue";
import type { Ref } from "vue";
import { toRef } from "vue";
import Col from "./Column.vue";

const props = defineProps<{
    collapsed: Ref<boolean>;
    display: CoercableComponent;
    content: CoercableComponent;
}>();

const displayComponent = computeComponent(toRef(props, "display"));
const contentComponent = computeComponent(toRef(props, "content"));
</script>

<style scoped>
.collapsible-container {
    width: calc(100% - 10px);
}

.collapsible-toggle {
    max-width: unset;
    width: calc(100% + 0px);
    margin: 0;
    margin-left: -5px;
    background: var(--raised-background);
    padding: var(--feature-margin);
    color: var(--foreground);
    cursor: pointer;
    transition-duration: 0s;
}

.collapsible-toggle:last-child {
    margin-left: unset;
}

:deep(.collapsible-toggle + .table) {
    max-width: unset;
    width: calc(100% + 10px);
    margin-left: -5px;
}

:deep(.col) {
    margin-top: 0;
    margin-bottom: 0;
    width: 100%;
}

.mergeAdjacent .collapsible-toggle {
    border: 0;
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
}

:deep(.mergeAdjacent .feature:not(.dontMerge):first-child) {
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
}
</style>
