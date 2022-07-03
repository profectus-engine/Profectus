<template>
    <Sticky>
        <div class="main-display">
            <span v-if="showPrefix">You have </span>
            <ResourceVue :resource="resource" :color="color || 'white'" />
            {{ resource.displayName
            }}<!-- remove whitespace -->
            <span v-if="effectComponent">, <component :is="effectComponent" /></span>
        </div>
    </Sticky>
</template>

<script setup lang="ts">
import Sticky from "components/layout/Sticky.vue";
import type { CoercableComponent } from "features/feature";
import type { Resource } from "features/resources/resource";
import ResourceVue from "features/resources/Resource.vue";
import Decimal from "util/bignum";
import { computeOptionalComponent } from "util/vue";
import type { Ref, StyleValue } from "vue";
import { computed, toRefs } from "vue";

const _props = defineProps<{
    resource: Resource;
    color?: string;
    classes?: Record<string, boolean>;
    style?: StyleValue;
    effectDisplay?: CoercableComponent;
}>();
const props = toRefs(_props);

const effectComponent = computeOptionalComponent(
    props.effectDisplay as Ref<CoercableComponent | undefined>
);

const showPrefix = computed(() => {
    return Decimal.lt(props.resource.value, "1e1000");
});
</script>

<style>
.main-display {
    height: 50px;
    line-height: 50px;
    margin-bottom: 20px;
}
</style>
