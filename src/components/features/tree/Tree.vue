<template>
    <span class="row" v-for="(row, index) in nodes" :key="index">
        <TreeNode v-for="(node, nodeIndex) in row" :key="nodeIndex" v-bind="wrapFeature(node)" />
    </span>
    <span class="left-side-nodes" v-if="leftSideNodes">
        <TreeNode
            v-for="(node, nodeIndex) in leftSideNodes"
            :key="nodeIndex"
            v-bind="wrapFeature(node)"
            small
        />
    </span>
    <span class="side-nodes" v-if="rightSideNodes">
        <TreeNode
            v-for="(node, nodeIndex) in rightSideNodes"
            :key="nodeIndex"
            v-bind="wrapFeature(node)"
            small
        />
    </span>
</template>

<script setup lang="ts">
import { FeatureComponent, wrapFeature } from "@/features/feature";
import { GenericTree } from "@/features/tree";
import TreeNode from "./TreeNode.vue";

defineProps<FeatureComponent<GenericTree>>();
</script>

<style scoped>
.row {
    margin: 50px auto;
}

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
</style>
