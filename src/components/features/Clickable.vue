<template>
    <div v-if="visibility !== Visibility.None" v-show="visibility === Visibility.Visible">
        <button
            :style="style"
            @click="onClick"
            @mousedown="start"
            @mouseleave="stop"
            @mouseup="stop"
            @touchstart="start"
            @touchend="stop"
            @touchcancel="stop"
            :disabled="!canClick"
            :class="{
                feature: true,
                clickable: true,
                can: canClick,
                locked: !canClick,
                small,
                ...classes
            }"
        >
            <component v-if="component" :is="component" />
            <MarkNode :mark="mark" />
            <LinkNode :id="id" />
        </button>
    </div>
</template>

<script lang="tsx">
import { GenericClickable } from "@/features/clickable";
import { StyleValue, Visibility } from "@/features/feature";
import { coerceComponent, isCoercableComponent, setupHoldToClick } from "@/util/vue";
import { computed, defineComponent, PropType, toRefs, unref, UnwrapRef } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

export default defineComponent({
    props: {
        display: {
            type: Object as PropType<UnwrapRef<GenericClickable["display"]>>,
            required: true
        },
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        style: Object as PropType<StyleValue>,
        classes: Object as PropType<Record<string, boolean>>,
        onClick: Function as PropType<VoidFunction>,
        onHold: Function as PropType<VoidFunction>,
        canClick: {
            type: Boolean,
            required: true
        },
        small: Boolean,
        mark: [Boolean, String],
        id: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const { display, onClick, onHold } = toRefs(props);

        const component = computed(() => {
            const currDisplay = unref(display);
            if (currDisplay == null) {
                return null;
            }
            if (isCoercableComponent(currDisplay)) {
                return coerceComponent(currDisplay);
            }
            return (
                <span>
                    <div v-if={currDisplay.title}>
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        <component v-is={coerceComponent(currDisplay.title!, "h2")} />
                    </div>
                    <component v-is={coerceComponent(currDisplay.description, "div")} />
                </span>
            );
        });

        const { start, stop } = setupHoldToClick(onClick, onHold);

        return {
            start,
            stop,
            component,
            LinkNode,
            MarkNode,
            Visibility
        };
    }
});
</script>

<style scoped>
.clickable {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}
</style>
