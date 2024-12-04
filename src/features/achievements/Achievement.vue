<template>
    <button
        :style="{
            backgroundImage: (unref(earned) && unref(image) && `url(${image})`) || ''
        }"
        :class="{
            achievement: true,
            locked: !unref(earned),
            done: unref(earned),
            small: unref(small),
        }"
    >
        <Component />
    </button>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import { isJSXElement, render } from "util/vue";
import { Component, isRef, unref } from "vue";
import { Achievement } from "./achievement";
import { displayRequirements } from "game/requirements";

const props = defineProps<{
    display: Achievement["display"];
    earned: Achievement["earned"];
    requirements: Achievement["requirements"];
    image: Achievement["image"];
    small: Achievement["small"];
}>();

const Component = () => {
    if (props.display == null) {
        return null;
    } else if (
        isRef(props.display) ||
        typeof props.display === "string" ||
        isJSXElement(props.display)
    ) {
        return render(props.display);
    } else {
        const { requirement, effectDisplay, optionsDisplay } = props.display;
        return (
            <span>
                {requirement ?
                    render(requirement, el => <h3>{el}</h3>) :
                    displayRequirements(props.requirements ?? [])}
                {effectDisplay ? (
                    <div>
                        {render(effectDisplay, el => <b>{el}</b>)}
                    </div>
                ) : null}
                {optionsDisplay != null ? (
                    <div class="equal-spaced">
                        {render(optionsDisplay)}
                    </div>
                ) : null}
            </span>);
    }
};
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
