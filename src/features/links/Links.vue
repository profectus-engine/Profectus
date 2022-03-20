<template>
    <svg v-if="validLinks" v-bind="$attrs">
        <LinkVue
            v-for="(link, index) in validLinks"
            :key="index"
            :link="link"
            :startNode="nodes[link.startNode.id]!"
            :endNode="nodes[link.endNode.id]!"
        />
    </svg>
</template>

<script setup lang="ts">
import { Link } from "features/links/links";
import { NodesInjectionKey } from "game/layers";
import { computed, inject, toRef } from "vue";
import LinkVue from "./Link.vue";

const _props = defineProps<{ links?: Link[] }>();
const links = toRef(_props, "links");

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nodes = inject(NodesInjectionKey)!;

const validLinks = computed(
    () =>
        links.value?.filter(link => {
            const n = nodes.value;
            return (
                n[link.startNode.id]?.x != undefined &&
                n[link.startNode.id]?.y != undefined &&
                n[link.endNode.id]?.x != undefined &&
                n[link.endNode.id]?.y != undefined
            );
        }) ?? []
);
</script>
