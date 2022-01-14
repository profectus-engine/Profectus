<template>
    <div class="branch" ref="node"></div>
</template>

<script setup lang="ts">
import { RegisterLinkNodeInjectionKey, UnregisterLinkNodeInjectionKey } from "@/features/links";
import { computed, inject, ref, toRefs, unref, watch } from "vue";

const props = toRefs(defineProps<{ id: string }>());

const register = inject(RegisterLinkNodeInjectionKey);
const unregister = inject(UnregisterLinkNodeInjectionKey);

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
}
</script>

<style scoped>
.branch {
    position: absolute;
    z-index: -10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>
