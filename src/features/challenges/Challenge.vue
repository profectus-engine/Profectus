<template>
    <div
        v-if="isVisible(visibility)"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined
            },
            notifyStyle,
            unref(style) ?? {}
        ]"
        :class="{
            feature: true,
            challenge: true,
            done: unref(completed),
            canStart: unref(canStart) && !unref(maxed),
            maxed: unref(maxed),
            ...unref(classes)
        }"
    >
        <button
            class="toggleChallenge"
            @click="toggle"
            :disabled="!unref(canStart) || unref(maxed)"
        >
            {{ buttonText }}
        </button>
        <component v-if="unref(comp)" :is="unref(comp)" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import MarkNode from "components/MarkNode.vue";
import Node from "components/Node.vue";
import type { GenericChallenge } from "features/challenges/challenge";
import type { StyleValue } from "features/feature";
import { isHidden, isVisible, jsx, Visibility } from "features/feature";
import { getHighNotifyStyle, getNotifyStyle } from "game/notifications";
import { displayRequirements, Requirements } from "game/requirements";
import { coerceComponent, isCoercableComponent } from "util/vue";
import type { Component, UnwrapRef } from "vue";
import { computed, shallowRef, unref, watchEffect } from "vue";

const props = defineProps<{
    active: boolean;
    maxed: boolean;
    canComplete: boolean;
    display?: UnwrapRef<GenericChallenge["display"]>;
    requirements?: Requirements;
    visibility: Visibility | boolean;
    style?: StyleValue;
    classes?: Record<string, boolean>;
    completed: boolean;
    canStart: boolean;
    mark?: boolean | string;
    id: string;
    toggle: VoidFunction;
}>();

const buttonText = computed(() => {
    if (props.active) {
        return props.canComplete ? "Finish" : "Exit Early";
    }
    if (props.maxed) {
        return "Completed";
    }
    return "Start";
});

const comp = shallowRef<Component | string>("");

const notifyStyle = computed(() => {
    const currActive = props.active;
    const currCanComplete = props.canComplete;
    if (currActive) {
        if (currCanComplete) {
            return getHighNotifyStyle();
        }
        return getNotifyStyle();
    }
    return {};
});

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
    const Title = coerceComponent(currDisplay.title || "", "h3");
    const Description = coerceComponent(currDisplay.description, "div");
    const Goal = coerceComponent(currDisplay.goal != null ? currDisplay.goal : jsx(() => displayRequirements(props.requirements ?? [])), "h3");
    const Reward = coerceComponent(currDisplay.reward || "");
    const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
    comp.value = coerceComponent(
        jsx(() => (
            <span>
                {currDisplay.title != null ? (
                    <div>
                        <Title />
                    </div>
                ) : null}
                <Description />
                <div>
                    <br />
                    Goal: <Goal />
                </div>
                {currDisplay.reward != null ? (
                    <div>
                        <br />
                        Reward: <Reward />
                    </div>
                ) : null}
                {currDisplay.effectDisplay != null ? (
                    <div>
                        Currently: <EffectDisplay />
                    </div>
                ) : null}
            </span>
        ))
    );
});
</script>

<style scoped>
.challenge {
    background-color: var(--locked);
    width: 300px;
    min-height: 300px;
    color: black;
    font-size: 15px;
    display: flex;
    flex-flow: column;
    align-items: center;
}

.challenge.done {
    background-color: var(--bought);
}

.challenge button {
    min-height: 50px;
    width: 120px;
    border-radius: var(--border-radius);
    box-shadow: none !important;
    background: transparent;
}

.challenge.canStart button {
    cursor: pointer;
    background-color: var(--layer-color);
}
</style>
