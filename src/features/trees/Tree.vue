<template>
    <span class="row" v-for="(row, index) in unref(nodes)" :key="index" v-bind="$attrs">
        <TreeNode
            v-for="(node, nodeIndex) in row"
            :key="nodeIndex"
            v-bind="gatherNodeProps(node)"
            :force-tooltip="node.forceTooltip"
        />
    </span>
    <span class="left-side-nodes" v-if="unref(leftSideNodes)">
        <TreeNode
            v-for="(node, nodeIndex) in unref(leftSideNodes)"
            :key="nodeIndex"
            v-bind="gatherNodeProps(node)"
            :force-tooltip="node.forceTooltip"
            small
        />
    </span>
    <span class="side-nodes" v-if="unref(rightSideNodes)">
        <TreeNode
            v-for="(node, nodeIndex) in unref(rightSideNodes)"
            :key="nodeIndex"
            v-bind="gatherNodeProps(node)"
            :force-tooltip="node.forceTooltip"
            small
        />
    </span>
    <Links v-if="branches" :links="unref(branches)" />
</template>

<script lang="ts">
import "components/common/table.css";
import { GenericTreeNode, TreeBranch } from "features/trees/tree";
import { processedPropType } from "util/vue";
import { defineComponent, unref } from "vue";
import TreeNode from "./TreeNode.vue";
import Links from "features/links/Links.vue";

export default defineComponent({
    props: {
        nodes: {
            type: processedPropType<GenericTreeNode[][]>(Array),
            required: true
        },
        leftSideNodes: processedPropType<GenericTreeNode[]>(Array),
        rightSideNodes: processedPropType<GenericTreeNode[]>(Array),
        branches: processedPropType<TreeBranch[]>(Array)
    },
    components: { TreeNode, Links },
    setup() {
        function gatherNodeProps(node: GenericTreeNode) {
            const {
                display,
                visibility,
                style,
                classes,
                tooltip,
                onClick,
                onHold,
                color,
                glowColor,
                forceTooltip,
                canClick,
                mark,
                id
            } = node;
            return {
                display,
                visibility,
                style,
                classes,
                tooltip,
                onClick,
                onHold,
                color,
                glowColor,
                forceTooltip,
                canClick,
                mark,
                id
            };
        }

        return {
            gatherNodeProps,
            unref
        };
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
