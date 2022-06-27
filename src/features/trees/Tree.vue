<template>
    <component :is="nodesComp" />
    <component v-if="leftNodesComp" :is="leftNodesComp" />
    <component v-if="rightNodesComp" :is="rightNodesComp" />
    <Links v-if="branches" :links="unref(branches)" />
</template>

<script lang="tsx">
import "components/common/table.css";
import { jsx } from "features/feature";
import Links from "features/links/Links.vue";
import type { GenericTreeNode, TreeBranch } from "features/trees/tree";
import { coerceComponent, processedPropType, renderJSX, unwrapRef } from "util/vue";
import type { Component } from "vue";
import { defineComponent, shallowRef, toRefs, unref, watchEffect } from "vue";

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
    components: { Links },
    setup(props) {
        const { nodes, leftSideNodes, rightSideNodes } = toRefs(props);

        const nodesComp = shallowRef<Component | "">();
        watchEffect(() => {
            const currNodes = unwrapRef(nodes);
            nodesComp.value = coerceComponent(
                jsx(() => (
                    <>
                        {currNodes.map(row => (
                            <span class="row tree-row" style="margin: 50px auto;">
                                {row.map(renderJSX)}
                            </span>
                        ))}
                    </>
                ))
            );
        });

        const leftNodesComp = shallowRef<Component | "">();
        watchEffect(() => {
            const currNodes = unwrapRef(leftSideNodes);
            leftNodesComp.value = currNodes
                ? coerceComponent(
                      jsx(() => (
                          <span class="left-side-nodes small">{currNodes.map(renderJSX)}</span>
                      ))
                  )
                : "";
        });

        const rightNodesComp = shallowRef<Component | "">();
        watchEffect(() => {
            const currNodes = unwrapRef(rightSideNodes);
            rightNodesComp.value = currNodes
                ? coerceComponent(
                      jsx(() => <span class="side-nodes small">{currNodes.map(renderJSX)}</span>)
                  )
                : "";
        });

        return {
            unref,
            nodesComp,
            leftNodesComp,
            rightNodesComp
        };
    }
});
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
