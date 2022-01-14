<template>
    <div v-if="visibility !== Visibility.None" v-show="visibility === Visibility.Visible">
        <button
            :style="style"
            @click="onClick"
            @mousedown="start"
            @mouseleave="stop"
            @mouseup="stop"
            @touchstart="start"
            @touchend="stop"
            @touchcancel="stop"
            :disabled="!canClick"
            :class="{
                feature: true,
                clickable: true,
                can: props.canClick,
                locked: !canClick,
                small,
                ...classes
            }"
        >
            <component v-if="component" :is="component" />
            <MarkNode :mark="mark" />
            <LinkNode :id="id" />
        </button>
    </div>
</template>

<script setup lang="tsx">
import { GenericClickable } from "@/features/clickable";
import { FeatureComponent, Visibility } from "@/features/feature";
import { coerceComponent, isCoercableComponent, setupHoldToClick } from "@/util/vue";
import { computed, toRefs, unref } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

const props = toRefs(defineProps<FeatureComponent<GenericClickable>>());

const component = computed(() => {
    const display = unref(props.display);
    if (display == null) {
        return null;
    }
    if (isCoercableComponent(display)) {
        return coerceComponent(display);
    }
    return (
        <span>
            <div v-if={display.title}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <component v-is={coerceComponent(display.title!, "h2")} />
            </div>
            <component v-is={coerceComponent(display.description, "div")} />
        </span>
    );
});

const { start, stop } = setupHoldToClick(props.onClick, props.onHold);
</script>

<style scoped>
.clickable {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}
</style>
