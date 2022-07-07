<template>
    <div
        class="tooltip-container"
        :class="{ shown: isShown }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @click.capture="togglePinned"
    >
        <slot />
        <component v-if="elementComp" :is="elementComp" />
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
                <component v-if="comp" :is="comp" />
            </div>
        </transition>
    </div>
</template>

<script lang="tsx">
import themes from "data/themes";
import type { CoercableComponent } from "features/feature";
import { jsx, StyleValue } from "features/feature";
import type { Persistent } from "game/persistence";
import settings from "game/settings";
import { Direction } from "util/common";
import type { VueFeature } from "util/vue";
import {
    coerceComponent,
    computeOptionalComponent,
    processedPropType,
    renderJSX,
    unwrapRef
} from "util/vue";
import type { Component, PropType } from "vue";
import { computed, defineComponent, ref, shallowRef, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        element: Object as PropType<VueFeature>,
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        style: processedPropType<StyleValue>(Object, String, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        direction: processedPropType<Direction>(String),
        xoffset: processedPropType<string>(String),
        yoffset: processedPropType<string>(String),
        pinned: Object as PropType<Persistent<boolean>>
    },
    setup(props) {
        const { element, display, pinned } = toRefs(props);

        const isHovered = ref(false);
        const isShown = computed(() => (unwrapRef(pinned) || isHovered.value) && comp.value);
        const comp = computeOptionalComponent(display);

        const elementComp = shallowRef<Component | "" | null>(
            coerceComponent(
                jsx(() => {
                    const currComponent = unwrapRef(element);
                    return currComponent == null ? "" : renderJSX(currComponent);
                })
            )
        );

        function togglePinned(e: MouseEvent) {
            const isPinned = pinned as unknown as Persistent<boolean> | undefined; // Vue typing :/
            if (e.shiftKey && isPinned) {
                isPinned.value = !isPinned.value;
                e.stopPropagation();
                e.preventDefault();
            }
        }

        const showPin = computed(() => unwrapRef(pinned) && themes[settings.theme].showPin);

        return {
            Direction,
            isHovered,
            isShown,
            comp,
            elementComp,
            unref,
            togglePinned,
            showPin
        };
    }
});
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
