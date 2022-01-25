<template>
    <span class="row" v-for="(row, index) in nodes" :key="index">
        <TreeNode
            v-for="(node, nodeIndex) in row"
            :key="nodeIndex"
            v-bind="node"
            :force-tooltip="node.forceTooltip"
        />
    </span>
    <span class="left-side-nodes" v-if="leftSideNodes">
        <TreeNode
            v-for="(node, nodeIndex) in leftSideNodes"
            :key="nodeIndex"
            v-bind="node"
            :force-tooltip="node.forceTooltip"
            small
        />
    </span>
    <span class="side-nodes" v-if="rightSideNodes">
        <TreeNode
            v-for="(node, nodeIndex) in rightSideNodes"
            :key="nodeIndex"
            v-bind="node"
            :force-tooltip="node.forceTooltip"
            small
        />
    </span>
</template>

<script lang="ts">
import { GenericTreeNode } from "@/features/tree";
import { defineComponent, PropType } from "vue";
import TreeNode from "./TreeNode.vue";

export default defineComponent({
    props: {
        nodes: {
            type: Array as PropType<GenericTreeNode[][]>,
            required: true
        },
        leftSideNodes: Array as PropType<GenericTreeNode[]>,
        rightSideNodes: Array as PropType<GenericTreeNode[]>
    },
    setup() {
        return { TreeNode };
    }
});
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
