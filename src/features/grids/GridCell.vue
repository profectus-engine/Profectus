<template>
    <button
        v-if="unref(visibility) !== Visibility.None"
        :class="{ feature: true, tile: true, can: unref(canClick), locked: !unref(canClick) }"
        :style="[
            {
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart.passive="start"
        @touchend.passive="stop"
        @touchcancel.passive="stop"
    >
        <div v-if="title"><component :is="titleComponent" /></div>
        <component :is="component" style="white-space: pre-line" />
        <Node :id="id" />
    </button>
</template>

<script lang="ts">
import "components/common/features.css";
import Node from "components/Node.vue";
import type { CoercableComponent, StyleValue } from "features/feature";
import { Visibility } from "features/feature";
import {
    computeComponent,
    computeOptionalComponent,
    processedPropType,
    setupHoldToClick
} from "util/vue";
import type { PropType } from "vue";
import { defineComponent, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        onClick: Function as PropType<(e?: MouseEvent | TouchEvent) => void>,
        onHold: Function as PropType<VoidFunction>,
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        title: processedPropType<CoercableComponent>(Object, String, Function),
        style: processedPropType<StyleValue>(String, Object, Array),
        canClick: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    components: {
        Node
    },
    setup(props) {
        const { onClick, onHold, title, display } = toRefs(props);

        const { start, stop } = setupHoldToClick(onClick, onHold);

        const titleComponent = computeOptionalComponent(title);
        const component = computeComponent(display);

        return {
            start,
            stop,
            titleComponent,
            component,
            Visibility,
            unref
        };
    }
});
</script>

<style scoped>
.tile {
    min-height: 80px;
    width: 80px;
    font-size: 10px;
    background-color: var(--layer-color);
}

.tile > * {
    pointer-events: none;
}
</style>
