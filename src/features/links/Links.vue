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
import type { FeatureNode } from "game/layers";
import { BoundsInjectionKey, NodesInjectionKey } from "game/layers";
import { computed, inject, MaybeRef, onMounted, ref, shallowRef, unref, watch } from "vue";
import LinkVue from "./Link.vue";
import { Link } from "./links";

const props = defineProps<{ links: MaybeRef<Link[]> }>();

function updateBounds() {
    boundingRect.value = resizeListener.value?.getBoundingClientRect();
}

const resizeObserver = new ResizeObserver(updateBounds);
const resizeListener = shallowRef<HTMLElement | null>(null);

const nodes = inject(NodesInjectionKey, ref<Record<string, FeatureNode | undefined>>({}));
const outerBoundingRect = inject(BoundsInjectionKey, ref<DOMRect | undefined>(undefined));
const boundingRect = ref<DOMRect | undefined>(resizeListener.value?.getBoundingClientRect());
watch(outerBoundingRect, updateBounds);
onMounted(() => {
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
    }
    updateBounds();
});

const validLinks = computed(() => {
    const n = nodes.value;
    return (
        unref(props.links)?.filter(link =>
            n[link.startNode.id]?.rect && n[link.endNode.id]?.rect) ?? []
    );
});
</script>

<style scoped>
.resize-listener, svg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -10;
    pointer-events: none;
    margin: 0;
    width: 100%;
    height: 100%;
}
</style>
