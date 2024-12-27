<template>
    <div
        class="tooltip-container"
        :class="{ shown: isShown }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @click.capture="togglePinned"
    >
        <slot />
        <transition name="fade">
            <div
                v-if="isShown"
                class="tooltip"
                :class="{
                    top: unref(direction) === Direction.Up,
                    left: unref(direction) === Direction.Left,
                    right: unref(direction) === Direction.Right,
                    bottom: unref(direction) === Direction.Down,
                    ...unref(classes)
                }"
                :style="[
                    {
                        '--xoffset': unref(xoffset) || '0px',
                        '--yoffset': unref(yoffset) || '0px'
                    },
                    unref(style) ?? {}
                ]"
            >
                <span v-if="showPin" class="material-icons pinned">push_pin</span>
                <Component />
            </div>
        </transition>
    </div>
</template>

<script setup lang="tsx">
import themes from "data/themes";
import settings from "game/settings";
import { Direction } from "util/common";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import type { Component, CSSProperties, MaybeRef, Ref } from "vue";
import { computed, ref, unref } from "vue";

const props = defineProps<{
    pinned?: Ref<boolean>;
    display: MaybeGetter<Renderable>;
    style?: MaybeRef<CSSProperties>;
    classes?: MaybeRef<Record<string, boolean>>;
    direction: MaybeRef<Direction>;
    xoffset?: MaybeRef<string>;
    yoffset?: MaybeRef<string>;
}>();

const isHovered = ref(false);
const isShown = computed(() => props.pinned?.value === true || isHovered.value);

const Component = () => render(props.display);

function togglePinned(e: MouseEvent) {
    const isPinned = props.pinned;
    if (e.shiftKey && isPinned != null) {
        isPinned.value = !isPinned.value;
        e.stopPropagation();
        e.preventDefault();
    }
}

const showPin = computed(() => props.pinned?.value === true && themes[settings.theme].showPin);
</script>

<style scoped>
.tooltip-container {
    position: relative;
    --xoffset: 0px;
    --yoffset: 0px;
    text-shadow: none !important;
}

.tooltip,
.tooltip::after {
    pointer-events: none;
    position: absolute;
}

.tooltip {
    text-align: center;
    width: 150px;
    font-size: 14px;
    line-height: 1.2;
    bottom: calc(100% + var(--yoffset));
    left: calc(50% + var(--xoffset));
    margin-bottom: 5px;
    transform: translateX(-50%);
    padding: 7px;
    border-radius: 3px;
    background-color: var(--tooltip-background);
    color: var(--points);
    z-index: 100 !important;
    word-break: break-word;
}

.tooltip :deep(hr) {
    margin: var(--feature-margin) 0;
}

.shown {
    z-index: 10;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.tooltip::after {
    content: " ";
    position: absolute;
    top: 100%;
    bottom: 100%;
    left: calc(50% - var(--xoffset));
    width: 0;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--tooltip-background) transparent transparent transparent;
}

.tooltip.left,
.side-nodes .tooltip:not(.right):not(.bottom):not(.top) {
    bottom: calc(50% + var(--yoffset));
    left: unset;
    right: calc(100% + var(--xoffset));
    margin-bottom: unset;
    margin-right: 5px;
    transform: translateY(50%);
}

.tooltip.left::after,
.side-nodes .tooltip:not(.right):not(.bottom):not(.top)::after {
    top: calc(50% + var(--yoffset));
    bottom: unset;
    left: 100%;
    right: 100%;
    margin-left: unset;
    margin-top: -5px;
    border-color: transparent transparent transparent var(--tooltip-background);
}

.tooltip.right {
    bottom: calc(50% + var(--yoffset));
    left: calc(100% + var(--xoffset));
    margin-bottom: unset;
    margin-left: 5px;
    transform: translateY(50%);
}

.tooltip.right::after {
    top: calc(50% + var(--yoffset));
    left: 0;
    right: 100%;
    margin-left: -10px;
    margin-top: -5px;
    border-color: transparent var(--tooltip-background) transparent transparent;
}

.tooltip.bottom {
    top: calc(100% + var(--yoffset));
    bottom: unset;
    left: calc(50% + var(--xoffset));
    margin-bottom: unset;
    margin-top: 5px;
    transform: translateX(-50%);
}

.tooltip.bottom::after {
    top: 0;
    margin-top: -10px;
    border-color: transparent transparent var(--tooltip-background) transparent;
}

.pinned {
    position: absolute;
    right: -5px;
    top: -5px;
    transform: rotateZ(45deg);
}
</style>
