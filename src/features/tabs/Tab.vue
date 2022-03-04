<template>
    <component :is="component" />
</template>

<script setup lang="ts">
import { CoercableComponent } from "features/feature";
import { computeComponent } from "util/vue";
import { toRefs } from "vue";

const _props = defineProps<{ display: CoercableComponent }>();
const { display } = toRefs(_props);
const component = computeComponent(display);
</script>
