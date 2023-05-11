<template>
    <slot />
    <div ref="resizeListener" class="resize-listener" />
</template>

<script setup lang="ts">
import {
    RegisterNodeInjectionKey,
    UnregisterNodeInjectionKey,
    NodesInjectionKey,
    BoundsInjectionKey
} from "game/layers";
import type { FeatureNode } from "game/layers";
import { Ref, nextTick, onMounted, provide, ref } from "vue";
import { globalBus } from "game/events";

const emit = defineEmits<{
    (e: "updateNodes", nodes: Record<string, FeatureNode | undefined>): void;
}>();

const nodes = ref<Record<string, FeatureNode | undefined>>({});

const resizeObserver = new ResizeObserver(updateBounds);
const resizeListener = ref<Element | null>(null) as Ref<Element | null>;
onMounted(() => {
    // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
    const resListener = resizeListener.value;
    if (resListener != null) {
        resizeObserver.observe(resListener);
    }
});
let isDirty = true;
const boundingRect = ref(resizeListener.value?.getBoundingClientRect());
function updateBounds() {
    if (isDirty) {
        isDirty = false;
        nextTick(() => {
            boundingRect.value = resizeListener.value?.getBoundingClientRect();
            (Object.values(nodes.value) as FeatureNode[])
                .filter(n => n) // Sometimes the values become undefined
                .forEach(node => (node.rect = node.element.getBoundingClientRect()));
            emit("updateNodes", nodes.value);
            isDirty = true;
        });
    }
}
globalBus.on("fontsLoaded", updateBounds);

const observerOptions = {
    attributes: false,
    childList: true,
    subtree: false
};

provide(RegisterNodeInjectionKey, (id, element) => {
    const observer = new MutationObserver(() => updateNode(id));
    observer.observe(element, observerOptions);
    nodes.value[id] = { element, observer, rect: element.getBoundingClientRect() };
    updateBounds();
});
provide(UnregisterNodeInjectionKey, id => {
    nodes.value[id]?.observer.disconnect();
    nodes.value[id] = undefined;
    updateBounds();
});
provide(NodesInjectionKey, nodes);
provide(BoundsInjectionKey, boundingRect);

function updateNode(id: string) {
    const node = nodes.value[id];
    if (node == null) {
        return;
    }
    node.rect = node.element.getBoundingClientRect();
    emit("updateNodes", nodes.value);
}
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
</style>
