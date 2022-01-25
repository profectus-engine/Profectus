<template>
    <h2 v-bind:style="{ color, 'text-shadow': '0px 0px 10px ' + color }">
        {{ amount }}
    </h2>
</template>

<script setup lang="ts">
import { displayResource, Resource } from "@/features/resource";
import { computed, toRefs } from "vue";

const _props = defineProps<{
    resource: Resource;
    color: string;
}>();
const props = toRefs(_props);

const amount = computed(() => displayResource(props.resource));
</script>
