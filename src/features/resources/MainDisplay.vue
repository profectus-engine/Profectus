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
                <span v-if="effectDisplay"
                    >, <Effect ref="effectRef"
                /></span>
            </div>
        </div>
    </Sticky>
</template>

<script setup lang="ts">
import Sticky from "components/layout/Sticky.vue";
import type { Resource } from "features/resources/resource";
import ResourceVue from "features/resources/Resource.vue";
import Decimal from "util/bignum";
import { Renderable } from "util/vue";
import { ComponentPublicInstance, computed, MaybeRefOrGetter, ref, StyleValue, toValue } from "vue";

const props = defineProps<{
    resource: Resource;
    color?: string;
    classes?: Record<string, boolean>;
    style?: StyleValue;
    effectDisplay?: MaybeRefOrGetter<Renderable>;
}>();

const effectRef = ref<ComponentPublicInstance | null>(null);

const Effect = () => toValue(props.effectDisplay);

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
