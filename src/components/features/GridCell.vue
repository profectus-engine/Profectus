<template>
    <button
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :class="{ feature: true, tile: true, can: canClick, locked: !canClick }"
        :style="style"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart="start"
        @touchend="stop"
        @touchcancel="stop"
        :disabled="!canClick"
    >
        <div v-if="title"><component :is="titleComponent" /></div>
        <component :is="component" style="white-space: pre-line" />
        <LinkNode :id="id" />
    </button>
</template>

<script lang="ts">
import { CoercableComponent, StyleValue, Visibility } from "@/features/feature";
import { coerceComponent, setupHoldToClick } from "@/util/vue";
import { computed, defineComponent, PropType, toRefs, unref } from "vue";
import LinkNode from "../system/LinkNode.vue";

export default defineComponent({
    props: {
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        onClick: Function as PropType<VoidFunction>,
        onHold: Function as PropType<VoidFunction>,
        display: {
            type: [Object, String] as PropType<CoercableComponent>,
            required: true
        },
        title: [Object, String] as PropType<CoercableComponent>,
        style: Object as PropType<StyleValue>,
        canClick: {
            type: Boolean,
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const { onClick, onHold, title, display } = toRefs(props);

        const { start, stop } = setupHoldToClick(onClick, onHold);

        const titleComponent = computed(() => {
            const currTitle = unref(title);
            return currTitle && coerceComponent(currTitle);
        });
        const component = computed(() => coerceComponent(unref(display)));

        return {
            start,
            stop,
            titleComponent,
            component,
            Visibility,
            LinkNode
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
</style>
