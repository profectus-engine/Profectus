<template>
    <button
        v-if="isVisible(visibility)"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        @click="purchase"
        :class="{
            feature: true,
            upgrade: true,
            can: unref(canPurchase),
            locked: !unref(canPurchase),
            bought: unref(bought),
            ...unref(classes)
        }"
        :disabled="!unref(canPurchase)"
    >
        <component v-if="unref(component)" :is="unref(component)" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </button>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import MarkNode from "components/MarkNode.vue";
import Node from "components/Node.vue";
import type { StyleValue } from "features/feature";
import { isHidden, isVisible, jsx, Visibility } from "features/feature";
import type { GenericUpgrade } from "features/upgrades/upgrade";
import { displayRequirements, Requirements } from "game/requirements";
import { coerceComponent, isCoercableComponent } from "util/vue";
import type { Component, UnwrapRef } from "vue";
import { shallowRef, unref, watchEffect } from "vue";

const props = defineProps<{
    display: UnwrapRef<GenericUpgrade["display"]>;
    visibility: Visibility | boolean;
    style?: StyleValue;
    classes?: Record<string, boolean>;
    requirements: Requirements;
    canPurchase: boolean;
    bought: boolean;
    mark?: boolean | string;
    id: string;
    purchase?: VoidFunction;
}>();

const component = shallowRef<Component | string>("");

watchEffect(() => {
    const currDisplay = props.display;
    if (currDisplay == null) {
        component.value = "";
        return;
    }
    if (isCoercableComponent(currDisplay)) {
        component.value = coerceComponent(currDisplay);
        return;
    }
    const Title = coerceComponent(currDisplay.title || "", "h3");
    const Description = coerceComponent(currDisplay.description, "div");
    const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
    component.value = coerceComponent(
        jsx(() => (
            <span>
                {currDisplay.title != null ? (
                    <div>
                        <Title />
                    </div>
                ) : null}
                <Description />
                {currDisplay.effectDisplay != null ? (
                    <div>
                        Currently: <EffectDisplay />
                    </div>
                ) : null}
                {props.bought ? null : <><br />{displayRequirements(props.requirements)}</>}
            </span>
        ))
    );
});
</script>

<style scoped>
.upgrade {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}

.upgrade > * {
    pointer-events: none;
}
</style>
