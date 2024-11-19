<template>
    <div
        :style="{
            backgroundColor: unref(color),
            boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 20px ${unref(
                glowColor
            )}`
        }"
        :class="{
            treeNode: true,
            can: unref(canClick)
        }"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
    >
        <Component />
    </div>
</template>

<script setup lang="tsx">
import { render, setupHoldToClick } from "util/vue";
import { toRef, unref } from "vue";
import { TreeNode } from "./tree";

const props = defineProps<{
    canClick: TreeNode["canClick"];
    display: TreeNode["display"];
    onClick: TreeNode["onClick"];
    onHold: TreeNode["onHold"];
    color: TreeNode["color"];
    glowColor: TreeNode["glowColor"];
}>();

const Component = () => props.display == null ? <></> :
    render(props.display, el => <div>{el}</div>);

const { start, stop } = setupHoldToClick(toRef(props, "onClick"), toRef(props, "onHold"));
</script>

<style scoped>
.treeNode {
    height: 100px;
    width: 100px;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: 50%;
    padding: 0;
    margin: 0 10px 0 10px;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
    display: flex;
}

.treeNode > * {
    pointer-events: none;
}
</style>
