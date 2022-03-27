<template>
    <Tooltip
        v-if="unref(visibility) !== Visibility.None"
        v-bind="tooltipToBind && gatherTooltipProps(tooltipToBind)"
        :display="tooltipDisplay"
        :force="forceTooltip"
        :style="{ visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined }"
        :class="{
            treeNode: true,
            can: unref(canClick),
            small: unref(small),
            ...unref(classes)
        }"
    >
        <div
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
        >
            <component :is="unref(comp)" />
        </div>
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </Tooltip>
</template>

<script lang="ts">
import Node from "components/Node.vue";
import MarkNode from "components/MarkNode.vue";
import TooltipVue from "components/Tooltip.vue";
import { CoercableComponent, StyleValue, Visibility } from "features/feature";
import { gatherTooltipProps, Tooltip } from "features/tooltip";
import { ProcessedComputable } from "util/computed";
import {
    computeOptionalComponent,
    isCoercableComponent,
    processedPropType,
    setupHoldToClick,
    unwrapRef
} from "util/vue";
import {
    computed,
    defineComponent,
    PropType,
    Ref,
    shallowRef,
    toRefs,
    unref,
    watchEffect
} from "vue";

export default defineComponent({
    props: {
        display: processedPropType<CoercableComponent>(Object, String, Function),
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        tooltip: processedPropType<CoercableComponent | Tooltip>(Object, String, Function),
        onClick: Function as PropType<(e?: MouseEvent | TouchEvent) => void>,
        onHold: Function as PropType<VoidFunction>,
        color: processedPropType<string>(String),
        glowColor: processedPropType<string>(String),
        forceTooltip: {
            type: Object as PropType<Ref<boolean>>,
            required: true
        },
        canClick: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        mark: processedPropType<boolean | string>(Boolean, String),
        id: {
            type: String,
            required: true
        },
        small: processedPropType<boolean>(Boolean)
    },
    components: {
        Tooltip: TooltipVue,
        MarkNode,
        Node
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

        const comp = computeOptionalComponent(display);
        const tooltipDisplay = shallowRef<ProcessedComputable<CoercableComponent> | undefined>(
            undefined
        );
        watchEffect(() => {
            const currTooltip = unwrapRef(tooltip);

            if (typeof currTooltip === "object" && !isCoercableComponent(currTooltip)) {
                tooltipDisplay.value = currTooltip.display;
                return;
            }
            tooltipDisplay.value = currTooltip;
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
            comp,
            tooltipDisplay,
            tooltipToBind,
            unref,
            Visibility,
            gatherTooltipProps,
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

.treeNode > *:first-child {
    width: 100%;
    height: 100%;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
    text-transform: capitalize;
    display: flex;
}

.treeNode.small {
    height: 60px;
    width: 60px;
}

.treeNode.small > *:first-child {
    font-size: 30px;
}

.ghost {
    visibility: hidden;
    pointer-events: none;
}
</style>
