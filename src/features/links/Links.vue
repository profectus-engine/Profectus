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
import { Link } from "features/links/links";
import { FeatureNode, NodesInjectionKey } from "game/layers";
import { computed, inject, nextTick, onMounted, ref, toRef } from "vue";
import LinkVue from "./Link.vue";

const _props = defineProps<{ links?: Link[] }>();
const links = toRef(_props, "links");

const resizeObserver = new ResizeObserver(updateNodes);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nodes = inject(NodesInjectionKey)!;

const resizeListener = ref<Element | null>(null);

onMounted(() => {
    // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
    }
});

let isDirty = true;
let boundingRect = ref(resizeListener.value?.getBoundingClientRect());
function updateNodes() {
    if (resizeListener.value != null && isDirty) {
        isDirty = false;
        nextTick(() => {
            boundingRect.value = resizeListener.value?.getBoundingClientRect();
            (Object.values(nodes.value) as FeatureNode[]).forEach(
                node => (node.rect = node.element.getBoundingClientRect())
            );
            isDirty = true;
        });
    }
}
document.fonts.ready.then(updateNodes);

const validLinks = computed(() => {
    const n = nodes.value;
    return (
        links.value?.filter(link => n[link.startNode.id]?.rect && n[link.startNode.id]?.rect) ?? []
    );
});
</script>

<style scoped>
.resize-listener,
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
