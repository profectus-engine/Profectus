<template>
    <div
        class="tooltip-container"
        :class="{ shown: isShown }"
        @mouseenter="setHover(true)"
        @mouseleave="setHover(false)"
    >
        <slot />
        <transition name="fade">
            <div
                v-if="isShown"
                class="tooltip"
                :class="{ top, left, right, bottom }"
                :style="{
                    '--xoffset': xoffset || '0px',
                    '--yoffset': yoffset || '0px'
                }"
            >
                <component :is="component" />
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { FeatureComponent } from "@/features/feature";
import { Tooltip } from "@/features/tooltip";
import { coerceComponent } from "@/util/vue";
import { computed, ref, toRefs, unref } from "vue";

const props = toRefs(defineProps<FeatureComponent<Tooltip>>());

const isHovered = ref(false);

function setHover(hover: boolean) {
    isHovered.value = hover;
}

const isShown = computed(() => unref(props.force) || isHovered.value);
const component = computed(() => props.display.value && coerceComponent(unref(props.display)));
</script>

<style scoped>
.tooltip-container {
    position: relative;
    --xoffset: 0px;
    --yoffset: 0px;
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
</style>
