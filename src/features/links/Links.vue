<template>
    <svg v-if="validLinks" v-bind="$attrs">
        <LinkVue
            v-for="(link, index) in validLinks"
            :key="index"
            :link="link"
            :boundingRect="boundingRect"
            :startNode="nodes[link.startNode.id]!"
            :endNode="nodes[link.endNode.id]!"
        />
    </svg>
    <div ref="resizeListener" class="resize-listener" />
</template>

<script setup lang="ts">
import type { Link } from "features/links/links";
import type { FeatureNode } from "game/layers";
import { BoundsInjectionKey, NodesInjectionKey } from "game/layers";
import { computed, inject, onMounted, ref, toRef, watch } from "vue";
import LinkVue from "./Link.vue";

const _props = defineProps<{ links?: Link[] }>();
const links = toRef(_props, "links");

const resizeListener = ref<Element | null>(null);

const nodes = inject(NodesInjectionKey, ref<Record<string, FeatureNode | undefined>>({}));
const outerBoundingRect = inject(BoundsInjectionKey, ref<DOMRect | undefined>(undefined));
const boundingRect = ref<DOMRect | undefined>(resizeListener.value?.getBoundingClientRect());
watch(
    outerBoundingRect,
    () => (boundingRect.value = resizeListener.value?.getBoundingClientRect())
);
onMounted(() => (boundingRect.value = resizeListener.value?.getBoundingClientRect()));

const validLinks = computed(() => {
    const n = nodes.value;
    return (
        links.value?.filter(link => n[link.startNode.id]?.rect && n[link.startNode.id]?.rect) ?? []
    );
});
</script>

<style scoped>
.resize-listener {
    position: absolute;
    top: 0px;
    left: 0;
    right: -4px;
    bottom: 5px;
    z-index: -10;
    pointer-events: none;
}

svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    pointer-events: none;
}
</style>
