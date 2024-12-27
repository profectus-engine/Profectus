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
import { Requirements } from "game/requirements";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import { Component, MaybeRef, Ref, unref } from "vue";

const props = defineProps<{
    display?: MaybeGetter<Renderable>;
    earned: Ref<boolean>;
    requirements?: Requirements;
    image?: MaybeRef<string>;
    small?: MaybeRef<boolean>;
}>();

const Component = () => props.display == null ? <></> : render(props.display);
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
