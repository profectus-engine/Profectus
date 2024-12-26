<template>
    <Nodes />
    <LeftNodes v-if="leftSideNodes" />
    <RightNodes v-if="rightSideNodes" />
    <Links v-if="branches" :links="unref(branches)" />
</template>

<script setup lang="tsx">
import "components/common/table.css";
import Links from "features/links/Links.vue";
import type { Tree } from "features/trees/tree";
import { render } from "util/vue";
import { unref } from "vue";

const props = defineProps<{
    nodes: Tree["nodes"];
    leftSideNodes: Tree["leftSideNodes"];
    rightSideNodes: Tree["rightSideNodes"];
    branches: Tree["branches"];
}>();

const Nodes = () => unref(props.nodes).map(nodes => 
    <span class="row tree-row" style="margin: 50px auto;">
        {nodes.map(node => render(node))}
    </span>);
    
const LeftNodes = () => props.leftSideNodes == null ? <></> : 
    <span class="left-side-nodes small">
        {unref(props.leftSideNodes).map(node => render(node))}
    </span>;

const RightNodes = () => props.rightSideNodes == null ? <></> : 
    <span class="side-nodes small">
        {unref(props.rightSideNodes).map(node => render(node))}
    </span>;
</script>

<style scoped>
.left-side-nodes {
    position: absolute;
    left: 15px;
    top: 65px;
}

.side-nodes {
    position: absolute;
    right: 15px;
    top: 65px;
}

.left-side-nodes :deep(.treeNode),
.side-nodes :deep(.treeNode) {
    margin: 20px auto;
}

.small :deep(.treeNode) {
    height: 60px;
    width: 60px;
}

.small :deep(.treeNode) > *:first-child {
    font-size: 30px;
}
</style>
