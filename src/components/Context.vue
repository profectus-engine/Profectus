<template>
    <slot />
</template>

<script setup lang="ts">
import {
    RegisterNodeInjectionKey,
    UnregisterNodeInjectionKey,
    NodesInjectionKey,
    FeatureNode
} from "game/layers";
import { nextTick, provide, ref } from "vue";

const nodes = ref<Record<string, FeatureNode | undefined>>({});

defineExpose({ nodes });

const observerOptions = {
    attributes: true,
    childList: true,
    subtree: false
};

provide(RegisterNodeInjectionKey, (id, element) => {
    const observer = new MutationObserver(() => updateNode(id));
    observer.observe(element, observerOptions);
    nodes.value[id] = { element, observer, rect: element.getBoundingClientRect() };
    nextTick(() => updateNode(id));
});
provide(UnregisterNodeInjectionKey, id => {
    nodes.value[id]?.observer.disconnect();
    nodes.value[id] = undefined;
});
provide(NodesInjectionKey, nodes);

function updateNode(id: string) {
    const node = nodes.value[id];
    if (node == null) {
        return;
    }
    node.rect = node.element.getBoundingClientRect();
}
</script>
