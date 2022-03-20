<template>
    <slot />
    <div ref="resizeListener" class="resize-listener" />
</template>

<script setup lang="ts">
import {
    RegisterNodeInjectionKey,
    UnregisterNodeInjectionKey,
    NodesInjectionKey,
    FeatureNode
} from "game/layers";
import { nextTick, onMounted, provide, ref } from "vue";

const observer = new MutationObserver(updateNodes);
const resizeObserver = new ResizeObserver(updateNodes);

const nodes = ref<Record<string, FeatureNode | undefined>>({});

defineExpose({ nodes });

const resizeListener = ref<Element | null>(null);

onMounted(() => {
    // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
    }
});

const observerOptions = {
    attributes: true,
    childList: true,
    subtree: false
};

provide(RegisterNodeInjectionKey, (id, element) => {
    nodes.value[id] = { element };
    observer.observe(element, observerOptions);
    nextTick(() => {
        if (resizeListener.value != null) {
            updateNode(id);
        }
    });
});
provide(UnregisterNodeInjectionKey, id => {
    nodes.value[id] = undefined;
});
provide(NodesInjectionKey, nodes);

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
    const nodeRect = node.element.getBoundingClientRect();

    node.y = nodeRect.x + nodeRect.width / 2 - boundingRect.x;
    node.x = nodeRect.y + nodeRect.height / 2 - boundingRect.y;
    node.rect = nodeRect;
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
