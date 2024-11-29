<template>
    <button
        v-if="isVisible(visibility)"
        :style="[
            { visibility: isHidden(visibility) ? 'hidden' : undefined },
            unref(style) ?? []
        ]"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
        :class="{
            feature: true,
            clickable: true,
            can: unref(canClick),
            locked: !unref(canClick),
            small,
            ...unref(classes)
        }"
    >
        <component v-if="unref(comp)" :is="unref(comp)" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import MarkNode from "components/MarkNode.vue";
import Node from "components/Node.vue";
import type { GenericClickable } from "features/clickables/clickable";
import type { StyleValue } from "features/feature";
import { isHidden, isVisible, jsx, Visibility } from "features/feature";
import {
    coerceComponent,
    isCoercableComponent,
    setupHoldToClick
} from "util/vue";
import type { Component, UnwrapRef } from "vue";
import { shallowRef, toRef, unref, watchEffect } from "vue";

const props = defineProps<{
    display: UnwrapRef<GenericClickable["display"]>;
    visibility: Visibility | boolean;
    style?: StyleValue;
    classes?: Record<string, boolean>;
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    onHold?: VoidFunction;
    canClick: boolean;
    small?: boolean;
    mark?: boolean | string;
    id: string;
}>();

const comp = shallowRef<Component | string>("");

watchEffect(() => {
    const currDisplay = props.display;
    if (currDisplay == null) {
        comp.value = "";
        return;
    }
    if (isCoercableComponent(currDisplay)) {
        comp.value = coerceComponent(currDisplay);
        return;
    }
    const Title = coerceComponent(currDisplay.title ?? "", "h3");
    const Description = coerceComponent(currDisplay.description, "div");
    comp.value = coerceComponent(
        jsx(() => (
            <span>
                {currDisplay.title != null ? (
                    <div>
                        <Title />
                    </div>
                ) : null}
                <Description />
            </span>
        ))
    );
});

const { start, stop } = setupHoldToClick(toRef(props, "onClick"), toRef(props, "onHold"));
</script>

<style scoped>
.clickable {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}

.clickable.small {
    min-height: unset;
}

.clickable > * {
    pointer-events: none;
}
</style>
