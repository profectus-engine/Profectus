<template>
    <slot />
    <div ref="resizeListener" class="resize-listener" />
    <svg v-if="validLinks" v-bind="$attrs">
        <LinkVue
            v-for="(link, index) in validLinks"
            :key="index"
            :link="link"
            :startNode="nodes[link.startNode.id]!"
            :endNode="nodes[link.endNode.id]!"
        />
    </svg>
</template>

<script setup lang="ts">
import {
    Link,
    LinkNode,
    RegisterLinkNodeInjectionKey,
    UnregisterLinkNodeInjectionKey
} from "features/links";
import { computed, nextTick, onMounted, provide, ref, toRef } from "vue";
import LinkVue from "./Link.vue";

const _props = defineProps<{ links?: Link[] }>();
const links = toRef(_props, "links");

const observer = new MutationObserver(updateNodes);
const resizeObserver = new ResizeObserver(updateNodes);

const nodes = ref<Record<string, LinkNode | undefined>>({});

const resizeListener = ref<Element | null>(null);

onMounted(() => {
    // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
    }
});

const validLinks = computed(
    () =>
        links.value?.filter(link => {
            const n = nodes.value;
            return (
                n[link.startNode.id]?.x != undefined &&
                n[link.startNode.id]?.y != undefined &&
                n[link.endNode.id]?.x != undefined &&
                n[link.endNode.id]?.y != undefined
            );
        }) ?? []
);

const observerOptions = {
    attributes: true,
    childList: true,
    subtree: false
};

provide(RegisterLinkNodeInjectionKey, (id, element) => {
    nodes.value[id] = { element };
    observer.observe(element, observerOptions);
    nextTick(() => {
        if (resizeListener.value != null) {
            updateNode(id);
        }
    });
});
provide(UnregisterLinkNodeInjectionKey, id => {
    nodes.value[id] = undefined;
});

let isDirty = true;
let boundingRect = resizeListener.value?.getBoundingClientRect();
function updateNodes() {
    if (resizeListener.value != null && isDirty) {
        isDirty = false;
        nextTick(() => {
            boundingRect = resizeListener.value?.getBoundingClientRect();
            Object.keys(nodes.value).forEach(id => updateNode(id));
            isDirty = true
        });
    }
}

function updateNode(id: string) {
    const node = nodes.value[id];
    if (!node || boundingRect == null) {
        return;
    }
    const linkStartRect = node.element.getBoundingClientRect();

    node.x = linkStartRect.x + linkStartRect.width / 2 - boundingRect.x;
    node.y = linkStartRect.y + linkStartRect.height / 2 - boundingRect.y;
}
</script>

<style scoped>
svg,
.resize-listener {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    pointer-events: none;
}
</style>
