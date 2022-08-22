<template>
    <div class="sticky" :style="{ top }" ref="element" data-v-sticky>
        <slot />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, shallowRef } from "vue";

const top = ref("0");
const observer = new ResizeObserver(updateTop);
const element = shallowRef<HTMLElement | null>(null);

function updateTop() {
    let el = element.value;
    if (el == undefined) {
        return;
    }

    let newTop = 0;
    while (el.previousSibling) {
        const sibling = el.previousSibling as HTMLElement;
        if (sibling.dataset && "vSticky" in sibling.dataset) {
            newTop += sibling.offsetHeight;
        }
        el = sibling;
    }
    top.value = newTop + "px";
}

nextTick(updateTop);
document.fonts.ready.then(updateTop);

onMounted(() => {
    const el = element.value?.parentElement;
    if (el) {
        observer.observe(el);
    }
});
</script>

<style scoped>
.sticky {
    position: sticky;
    background: var(--background);
    width: calc(100% - 2px);
    z-index: 3;
}
</style>
