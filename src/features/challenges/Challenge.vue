<template>
    <div
        :style="notifyStyle"
        :class="{
            challenge: true,
            done: unref(completed),
            canStart: unref(canStart) && !unref(maxed),
            maxed: unref(maxed)
        }"
    >
        <button
            class="toggleChallenge"
            @click="toggle"
            :disabled="!unref(canStart) || unref(maxed)"
        >
            {{ buttonText }}
        </button>
        <Component v-if="props.display" />
    </div>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import { getHighNotifyStyle, getNotifyStyle } from "game/notifications";
import { render } from "util/vue";
import type { Component } from "vue";
import { computed, unref } from "vue";
import { Challenge } from "./challenge";

const props = defineProps<{
    active: Challenge["active"];
    maxed: Challenge["maxed"];
    canComplete: Challenge["canComplete"];
    display: Challenge["display"];
    requirements: Challenge["requirements"];
    completed: Challenge["completed"];
    canStart: Challenge["canStart"];
    toggle: Challenge["toggle"];
}>();

const buttonText = computed(() => {
    if (unref(props.active)) {
        return unref(props.canComplete) ? "Finish" : "Exit Early";
    }
    if (unref(props.maxed)) {
        return "Completed";
    }
    return "Start";
});

const notifyStyle = computed(() => {
    const currActive = unref(props.active);
    const currCanComplete = unref(props.canComplete);
    if (currActive) {
        if (currCanComplete) {
            return getHighNotifyStyle();
        }
        return getNotifyStyle();
    }
    return {};
});

const Component = () => props.display == null ? <></> : render(props.display);
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
