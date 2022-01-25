<template>
    <div>
        <span v-if="showPrefix">You have </span>
        <ResourceVue :resource="resource" :color="color || 'white'" />
        {{ resource
        }}<!-- remove whitespace -->
        <span v-if="effectComponent">, <component :is="effectComponent" /></span>
        <br /><br />
    </div>
</template>

<script setup lang="ts">
import { CoercableComponent } from "@/features/feature";
import { Resource } from "@/features/resource";
import Decimal from "@/util/bignum";
import { coerceComponent } from "@/util/vue";
import { computed, StyleValue, toRefs } from "vue";
import ResourceVue from "../system/Resource.vue";

const props = toRefs(
    defineProps<{
        resource: Resource;
        color?: string;
        classes?: Record<string, boolean>;
        style?: StyleValue;
        effectDisplay?: CoercableComponent;
    }>()
);

const effectComponent = computed(() => {
    const effectDisplay = props.effectDisplay?.value;
    return effectDisplay && coerceComponent(effectDisplay);
});

const showPrefix = computed(() => {
    return Decimal.lt(props.resource.value, "1e1000");
});
</script>

<style scoped></style>
