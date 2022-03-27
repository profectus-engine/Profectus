<template>
    <Col style="width: 100%">
        <button @click="collapsed.value = !collapsed.value" class="feature collapsible-toggle">
            <component :is="displayComponent" />
        </button>
        <component v-if="!collapsed.value" :is="contentComponent" />
    </Col>
</template>

<script setup lang="ts">
import { CoercableComponent } from "features/feature";
import { coerceComponent } from "util/vue";
import { computed, Ref } from "vue";
import Col from "./Column.vue";

const props = defineProps<{
    collapsed: Ref<boolean>;
    display: CoercableComponent;
    content: CoercableComponent;
}>();

const displayComponent = computed(() => coerceComponent(props.display));
const contentComponent = computed(() => coerceComponent(props.content));
</script>

<style scoped>
.collapsible-toggle {
    width: calc(100% - 10px);
    background: var(--raised-background);
    padding: var(--feature-margin);
    color: var(--foreground);
    cursor: pointer;
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
