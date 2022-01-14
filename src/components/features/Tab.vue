<template>
    <component :is="component" />
</template>

<script setup lang="ts">
import { CoercableComponent } from "@/features/feature";
import { coerceComponent } from "@/util/vue";
import { computed, toRefs } from "vue";

const { display } = toRefs(defineProps<{ display: CoercableComponent }>());
const component = computed(() => coerceComponent(display));
</script>
