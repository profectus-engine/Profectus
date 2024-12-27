<template>
    <Sticky>
        <div
            class="main-display-container"
            :class="classes ?? {}"
            :style="[{ height: `${(displayRef?.clientHeight ?? 0) + 20}px` }, style ?? {}]">
            <div class="main-display" ref="displayRef">
                <span v-if="showPrefix">You have </span>
                <ResourceVue :resource="resource" :color="color || 'white'" />
                {{ resource.displayName }}<!-- remove whitespace -->
                <span v-if="effectDisplay">, <Effect /></span>
            </div>
        </div>
    </Sticky>
</template>

<script setup lang="ts">
import Sticky from "components/layout/Sticky.vue";
import type { Resource } from "features/resources/resource";
import ResourceVue from "features/resources/Resource.vue";
import Decimal from "util/bignum";
import { MaybeGetter } from "util/computed";
import { Renderable } from "util/vue";
import { computed, CSSProperties, ref, toValue } from "vue";

const props = defineProps<{
    resource: Resource;
    color?: string;
    classes?: Record<string, boolean>;
    style?: CSSProperties;
    effectDisplay?: MaybeGetter<Renderable>;
}>();

const displayRef = ref<Element | null>(null);

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
