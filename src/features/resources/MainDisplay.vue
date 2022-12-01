<template>
    <Sticky>
        <div
            class="main-display-container"
            :class="classes ?? {}"
            :style="[{ height: `${(effectRef?.$el.clientHeight ?? 0) + 50}px` }, style ?? {}]"
        >
            <div class="main-display">
                <span v-if="showPrefix">You have </span>
                <ResourceVue :resource="resource" :color="color || 'white'" />
                {{ resource.displayName
                }}<!-- remove whitespace -->
                <span v-if="effectComponent"
                    >, <component :is="effectComponent" ref="effectRef"
                /></span>
            </div>
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
import { ComponentPublicInstance, ref, Ref, StyleValue } from "vue";
import { computed, toRefs } from "vue";

const _props = defineProps<{
    resource: Resource;
    color?: string;
    classes?: Record<string, boolean>;
    style?: StyleValue;
    effectDisplay?: CoercableComponent;
}>();
const props = toRefs(_props);

const effectRef = ref<ComponentPublicInstance | null>(null);

const effectComponent = computeOptionalComponent(
    props.effectDisplay as Ref<CoercableComponent | undefined>
);

const showPrefix = computed(() => {
    return Decimal.lt(props.resource.value, "1e1000");
});
</script>

<style>
.main-display-container {
    vertical-align: middle;
    margin-bottom: 20px;
    display: flex;
    transition-duration: 0s;
}
</style>
