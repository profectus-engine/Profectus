<template>
    <h2 :style="{ color, 'text-shadow': '0px 0px 10px ' + color }">
        {{ amount }}
    </h2>
</template>

<script setup lang="ts">
import type { Resource } from "features/resources/resource";
import { displayResource } from "features/resources/resource";
import { computed } from "vue";

const props = defineProps<{
    resource: Resource;
    color: string;
}>();

const amount = computed(() => displayResource(props.resource));
</script>
