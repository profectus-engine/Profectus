<template>
    <div
        class="tooltip-container"
        :class="{ shown: isShown }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
    >
        <slot />
        <transition name="fade">
            <div
                v-if="isShown"
                class="tooltip"
                :class="{
                    top: unref(top),
                    left: unref(left),
                    right: unref(right),
                    bottom: unref(bottom)
                }"
                :style="{
                    '--xoffset': unref(xoffset) || '0px',
                    '--yoffset': unref(yoffset) || '0px'
                }"
            >
                <component v-if="comp" :is="comp" />
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { CoercableComponent } from "features/feature";
import { computeOptionalComponent, processedPropType, unwrapRef } from "util/vue";
import { computed, defineComponent, ref, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        display: processedPropType<CoercableComponent>(Object, String, Function),
        top: processedPropType<boolean>(Boolean),
        left: processedPropType<boolean>(Boolean),
        right: processedPropType<boolean>(Boolean),
        bottom: processedPropType<boolean>(Boolean),
        xoffset: processedPropType<string>(String),
        yoffset: processedPropType<string>(String),
        force: processedPropType<boolean>(Boolean)
    },
    setup(props) {
        const { display, force } = toRefs(props);

        const isHovered = ref(false);
        const isShown = computed(() => (unwrapRef(force) || isHovered.value) && comp.value);
        const comp = computeOptionalComponent(display);

        return {
            isHovered,
            isShown,
            comp,
            unref
        };
    }
});
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
