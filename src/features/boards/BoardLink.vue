<template>
    <line
        class="link"
        v-bind="link"
        :class="{ pulsing: link.pulsing }"
        :x1="startPosition.x"
        :y1="startPosition.y"
        :x2="endPosition.x"
        :y2="endPosition.y"
    />
</template>

<script setup lang="ts">
import type { BoardNode, BoardNodeLink } from "features/boards/board";
import { computed, toRefs, unref } from "vue";

const _props = defineProps<{
    link: BoardNodeLink;
    dragging: BoardNode | null;
    dragged?: {
        x: number;
        y: number;
    };
}>();
const props = toRefs(_props);

const startPosition = computed(() => {
    const position = { ...props.link.value.startNode.position };
    if (props.link.value.offsetStart) {
        position.x += unref(props.link.value.offsetStart).x;
        position.y += unref(props.link.value.offsetStart).y;
    }
    if (props.dragging?.value === props.link.value.startNode) {
        position.x += props.dragged?.value?.x ?? 0;
        position.y += props.dragged?.value?.y ?? 0;
    }
    return position;
});

const endPosition = computed(() => {
    const position = { ...props.link.value.endNode.position };
    if (props.link.value.offsetEnd) {
        position.x += unref(props.link.value.offsetEnd).x;
        position.y += unref(props.link.value.offsetEnd).y;
    }
    if (props.dragging?.value === props.link.value.endNode) {
        position.x += props.dragged?.value?.x ?? 0;
        position.y += props.dragged?.value?.y ?? 0;
    }
    return position;
});
</script>

<style scoped>
.link {
    transition-duration: 0s;
}

.link.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>
