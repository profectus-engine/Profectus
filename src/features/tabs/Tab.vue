<template>
    <component :is="component" />
</template>

<script setup lang="ts">
import type { CoercableComponent } from "features/feature";
import { computeComponent } from "util/vue";
import { toRef } from "vue";

const props = defineProps<{ display: CoercableComponent }>();
const component = computeComponent(toRef(props, "display"));
</script>
