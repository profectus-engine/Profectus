<template>
    <div
        v-if="isVisible(visibility)"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined,
                backgroundImage: (earned && image && `url(${image})`) || ''
            },
            unref(style) ?? []
        ]"
        :class="{
            feature: true,
            achievement: true,
            locked: !unref(earned),
            done: unref(earned),
            small: unref(small),
            ...unref(classes)
        }"
    >
        <component v-if="comp" :is="comp" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import { isHidden, isVisible, jsx, Visibility } from "features/feature";
import { displayRequirements, Requirements } from "game/requirements";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { Component, shallowRef, StyleValue, unref, UnwrapRef, watchEffect } from "vue";
import { GenericAchievement } from "./achievement";

const props = defineProps<{
    visibility: Visibility | boolean;
    display?: UnwrapRef<GenericAchievement["display"]>;
    earned: boolean;
    requirements?: Requirements;
    image?: string;
    style?: StyleValue;
    classes?: Record<string, boolean>;
    mark?: boolean | string;
    small?: boolean;
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
    const Requirement = coerceComponent(currDisplay.requirement ? currDisplay.requirement :
        jsx(() => displayRequirements(props.requirements ?? [])), "h3");
    const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "", "b");
    const OptionsDisplay = props.earned ?
        coerceComponent(currDisplay.optionsDisplay || "", "span") :
        "";
    comp.value = coerceComponent(
        jsx(() => (
            <span>
                <Requirement />
                {currDisplay.effectDisplay != null ? (
                    <div>
                        <EffectDisplay />
                    </div>
                ) : null}
                {currDisplay.optionsDisplay != null ? (
                    <div class="equal-spaced">
                        <OptionsDisplay />
                    </div>
                ) : null}
            </span>
        ))
    );
});
</script>

<style scoped>
.achievement {
    height: 90px;
    width: 90px;
    font-size: 10px;
    color: white;
    text-shadow: 0 0 2px #000000;
}

.achievement:not(.small) {
    height: unset;
    width: calc(100% - 10px);
    min-width: 120px;
    padding-left: 5px;
    padding-right: 5px;
    background-color: var(--locked);
    border-width: 4px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.5);
    font-size: unset;
    text-shadow: unset;
}

.achievement.done {
    background-color: var(--bought);
    cursor: default;
}

.achievement :deep(.equal-spaced) {
    display: flex;
    justify-content: center;
}

.achievement :deep(.equal-spaced > *) {
    margin: auto;
}
</style>
