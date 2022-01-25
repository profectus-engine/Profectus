<template>
    <Tooltip
        v-if="unref(visibility) !== Visibility.None"
        v-show="unref(visibility) === Visibility.Visible"
        v-bind="tooltipToBind"
        :display="tooltipDisplay"
        :force="forceTooltip"
        :class="{
            treeNode: true,
            can: unref(canClick),
            small: unref(small),
            ...unref(classes)
        }"
    >
        <button
            @click="click"
            @mousedown="start"
            @mouseleave="stop"
            @mouseup="stop"
            @touchstart="start"
            @touchend="stop"
            @touchcancel="stop"
            :style="[
                {
                    backgroundColor: unref(color),
                    boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 20px ${unref(
                        glowColor
                    )}`
                },
                unref(style) ?? []
            ]"
            :disabled="!unref(canClick)"
        >
            <component :is="component" />
        </button>
        <MarkNode :mark="unref(mark)" />
        <LinkNode :id="unref(id)" />
    </Tooltip>
</template>

<script lang="ts">
import TooltipVue from "@/components/system/Tooltip.vue";
import { CoercableComponent, StyleValue, Visibility } from "@/features/feature";
import { Tooltip } from "@/features/tooltip";
import { ProcessedComputable } from "@/util/computed";
import {
    computeOptionalComponent,
    isCoercableComponent,
    setupHoldToClick,
    unwrapRef
} from "@/util/vue";
import { computed, defineComponent, PropType, Ref, toRefs, unref } from "vue";
import LinkNode from "../../system/LinkNode.vue";
import MarkNode from "../MarkNode.vue";

export default defineComponent({
    props: {
        display: [Object, String] as PropType<ProcessedComputable<CoercableComponent>>,
        visibility: {
            type: Object as PropType<ProcessedComputable<Visibility>>,
            required: true
        },
        style: Object as PropType<ProcessedComputable<StyleValue>>,
        classes: Object as PropType<ProcessedComputable<Record<string, boolean>>>,
        tooltip: Object as PropType<ProcessedComputable<CoercableComponent | Tooltip>>,
        onClick: Function as PropType<VoidFunction>,
        onHold: Function as PropType<VoidFunction>,
        color: [Object, String] as PropType<ProcessedComputable<string>>,
        glowColor: [Object, String] as PropType<ProcessedComputable<string>>,
        forceTooltip: {
            type: Object as PropType<Ref<boolean>>,
            required: true
        },
        canClick: {
            type: [Object, Boolean] as PropType<ProcessedComputable<boolean>>,
            required: true
        },
        mark: [Object, Boolean, String] as PropType<ProcessedComputable<boolean | string>>,
        id: {
            type: [Object, String] as PropType<ProcessedComputable<string>>,
            required: true
        },
        small: [Object, Boolean] as PropType<ProcessedComputable<boolean>>
    },
    setup(props) {
        const { tooltip, forceTooltip, onClick, onHold, display } = toRefs(props);

        function click(e: MouseEvent) {
            if (e.shiftKey && tooltip) {
                forceTooltip.value = !forceTooltip.value;
            } else {
                unref(onClick)?.();
            }
        }

        const component = computeOptionalComponent(display);
        const tooltipDisplay = computed(() => {
            const currTooltip = unwrapRef(tooltip);

            if (typeof currTooltip === "object" && !isCoercableComponent(currTooltip)) {
                return currTooltip.display;
            }
            return currTooltip || "";
        });
        const tooltipToBind = computed(() => {
            const currTooltip = unwrapRef(tooltip);

            if (typeof currTooltip === "object" && !isCoercableComponent(currTooltip)) {
                return currTooltip;
            }
            return null;
        });

        const { start, stop } = setupHoldToClick(onClick, onHold);

        return {
            click,
            start,
            stop,
            component,
            tooltipDisplay,
            tooltipToBind,
            Tooltip: TooltipVue,
            MarkNode,
            LinkNode,
            unref,
            Visibility,
            isCoercableComponent
        };
    }
});
</script>

<style scoped>
.treeNode {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    padding: 0;
    margin: 0 10px 0 10px;
}

.treeNode button {
    width: 100%;
    height: 100%;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
    text-transform: capitalize;
}

.treeNode.small {
    height: 60px;
    width: 60px;
}

.treeNode.small button {
    font-size: 30px;
}

.ghost {
    visibility: hidden;
    pointer-events: none;
}
</style>
