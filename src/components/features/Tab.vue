<template>
    <component :is="component" />
</template>

<script setup lang="ts">
import { CoercableComponent } from "@/features/feature";
import { coerceComponent } from "@/util/vue";
import { computed, toRefs } from "vue";

const _props = defineProps<{ display: CoercableComponent }>();
const { display } = toRefs(_props);
const component = computed(() => coerceComponent(display));
</script>
