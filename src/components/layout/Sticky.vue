<template>
    <div class="sticky" :style="{ top }" ref="element" data-v-sticky>
        <slot />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

const top = ref("0");
const observer = new ResizeObserver(updateTop);
const element = ref<HTMLElement | null>(null);

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
    margin-left: -10px;
    margin-right: -10px;
    padding-left: 10px;
    padding-right: 10px;
    width: 100%;
    z-index: 3;
}

.modal-body .sticky {
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
}
</style>
