<template>
    <line
        stroke-width="15px"
        stroke="white"
        v-bind="linkProps"
        :x1="startPosition.x"
        :y1="startPosition.y"
        :x2="endPosition.x"
        :y2="endPosition.y"
    />
</template>

<script setup lang="ts">
import type { Link } from "features/links/links";
import type { FeatureNode } from "game/layers";
import { kebabifyObject } from "util/vue";
import { computed, toRefs } from "vue";

const _props = defineProps<{
    link: Link;
    startNode: FeatureNode;
    endNode: FeatureNode;
    boundingRect: DOMRect | undefined;
}>();
const props = toRefs(_props);

const startPosition = computed(() => {
    const rect = props.startNode.value.rect;
    const boundingRect = props.boundingRect.value;
    const position = boundingRect
        ? {
              x: rect.x + rect.width / 2 - boundingRect.x,
              y: rect.y + rect.height / 2 - boundingRect.y
          }
        : { x: 0, y: 0 };
    if (props.link.value.offsetStart) {
        position.x += props.link.value.offsetStart.x;
        position.y += props.link.value.offsetStart.y;
    }
    return position;
});

const endPosition = computed(() => {
    const rect = props.endNode.value.rect;
    const boundingRect = props.boundingRect.value;
    const position = boundingRect
        ? {
              x: rect.x + rect.width / 2 - boundingRect.x,
              y: rect.y + rect.height / 2 - boundingRect.y
          }
        : { x: 0, y: 0 };
    if (props.link.value.offsetEnd) {
        position.x += props.link.value.offsetEnd.x;
        position.y += props.link.value.offsetEnd.y;
    }
    return position;
});

const linkProps = computed(() => kebabifyObject(_props.link as unknown as Record<string, unknown>));
</script>
