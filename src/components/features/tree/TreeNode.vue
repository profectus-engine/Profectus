<template>
    <Tooltip
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        v-bind="typeof tooltip === 'object' ? wrapFeature(tooltip) : null"
        :display="typeof tooltip === 'object' ? unref(tooltip.display) : tooltip || ''"
        :force="forceTooltip"
        :class="{
            treeNode: true,
            can: canClick,
            small,
            ...classes
        }"
    >
        <button
            @click="click"
            @mousedown="start"
            @mouseleave="stop"
            @mouseup="stop"
            @touchstart="start"
            @touchend="stop"
            @touchcancel="stop"
            :style="[
                {
                    backgroundColor: color,
                    boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 20px ${glowColor}`
                },
                style ?? []
            ]"
            :disabled="!canClick"
        >
            <component :is="component" />
        </button>
        <MarkNode :mark="mark" />
        <LinkNode :id="id" />
    </Tooltip>
</template>

<script setup lang="ts">
import { GenericTreeNode } from "@/features/tree";
import { coerceComponent, setupHoldToClick } from "@/util/vue";
import { computed, toRefs, unref } from "vue";
import Tooltip from "@/components/system/Tooltip.vue";
import MarkNode from "../MarkNode.vue";
import { FeatureComponent, Visibility, wrapFeature } from "@/features/feature";
import LinkNode from "../../system/LinkNode.vue";

const props = toRefs(
    defineProps<
        FeatureComponent<GenericTreeNode> & {
            small?: boolean;
        }
    >()
);

function click(e: MouseEvent) {
    if (e.shiftKey && props.tooltip) {
        props.forceTooltip.value = !props.forceTooltip.value;
    } else {
        unref(props.onClick)?.();
    }
}

const component = computed(() => {
    const display = unref(props.display);
    return display && coerceComponent(display);
});

const { start, stop } = setupHoldToClick(props.onClick, props.onHold);
</script>

<style scoped>
.treeNode {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    padding: 0;
    margin: 0 10px 0 10px;
}

.treeNode button {
    width: 100%;
    height: 100%;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
    text-transform: capitalize;
}

.treeNode.small {
    height: 60px;
    width: 60px;
}

.treeNode.small button {
    font-size: 30px;
}

.ghost {
    visibility: hidden;
    pointer-events: none;
}
</style>
