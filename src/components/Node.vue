<template>
    <div class="node" ref="node"></div>
</template>

<script setup lang="ts">
import { RegisterNodeInjectionKey, UnregisterNodeInjectionKey } from "game/layers";
import { computed, inject, onUnmounted, ref, toRefs, unref, watch } from "vue";

const _props = defineProps<{ id: string }>();
const props = toRefs(_props);

const register = inject(RegisterNodeInjectionKey);
const unregister = inject(UnregisterNodeInjectionKey);

const node = ref<HTMLElement | null>(null);
const parentNode = computed(() => node.value && node.value.parentElement);

if (register && unregister) {
    watch([parentNode, props.id], ([newNode, newID], [prevNode, prevID]) => {
        if (prevNode) {
            unregister(unref(prevID));
        }
        if (newNode) {
            register(newID, newNode);
        }
    });

    onUnmounted(() => unregister(unref(props.id)));
}
</script>

<style scoped>
.node {
    position: absolute;
    z-index: -10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>
