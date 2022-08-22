<template>
    <div class="node" ref="node"></div>
</template>

<script setup lang="ts">
import { RegisterNodeInjectionKey, UnregisterNodeInjectionKey } from "game/layers";
import { computed, inject, onUnmounted, shallowRef, toRefs, unref, watch } from "vue";

const _props = defineProps<{ id: string }>();
const props = toRefs(_props);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const register = inject(RegisterNodeInjectionKey, () => {});
// eslint-disable-next-line @typescript-eslint/no-empty-function
const unregister = inject(UnregisterNodeInjectionKey, () => {});

const node = shallowRef<HTMLElement | null>(null);
const parentNode = computed(() => node.value && node.value.parentElement);

watch([parentNode, props.id], ([newNode, newID], [prevNode, prevID]) => {
    if (prevNode) {
        unregister(unref(prevID));
    }
    if (newNode) {
        register(newID, newNode);
    }
});

onUnmounted(() => unregister(unref(props.id)));
</script>

<style scoped>
.node {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>
