<template>
    <line
        stroke-width="15px"
        stroke="white"
        v-bind="link"
        :x1="startPosition.x"
        :y1="startPosition.y"
        :x2="endPosition.x"
        :y2="endPosition.y"
    />
</template>

<script setup lang="ts">
import { Link, LinkNode } from "features/links";
import { computed, toRefs, unref } from "vue";

const _props = defineProps<{
    link: Link;
    startNode: LinkNode;
    endNode: LinkNode;
}>();
const props = toRefs(_props);

const startPosition = computed(() => {
    const position = { x: props.startNode.value.x || 0, y: props.startNode.value.y || 0 };
    if (props.link.value.offsetStart) {
        position.x += unref(props.link.value.offsetStart).x;
        position.y += unref(props.link.value.offsetStart).y;
    }
    return position;
});

const endPosition = computed(() => {
    const position = { x: props.endNode.value.x || 0, y: props.endNode.value.y || 0 };
    if (props.link.value.offsetEnd) {
        position.x += unref(props.link.value.offsetEnd).x;
        position.y += unref(props.link.value.offsetEnd).y;
    }
    return position;
});
</script>

<style scoped></style>
