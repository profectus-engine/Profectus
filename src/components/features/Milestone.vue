<template>
    <div
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="style"
        :class="{ feature: true, milestone: true, done: earned, ...classes }"
    >
        <component v-if="component" :is="component" />
        <LinkNode :id="id" />
    </div>
</template>

<script lang="tsx">
import { StyleValue, Visibility } from "@/features/feature";
import { GenericMilestone } from "@/features/milestone";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, defineComponent, PropType, toRefs, UnwrapRef } from "vue";
import LinkNode from "../system/LinkNode.vue";

export default defineComponent({
    props: {
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        display: {
            type: Object as PropType<UnwrapRef<GenericMilestone["display"]>>,
            required: true
        },
        style: Object as PropType<StyleValue>,
        classes: Object as PropType<Record<string, boolean>>,
        earned: {
            type: Boolean,
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const { display } = toRefs(props);

        const component = computed(() => {
            const currDisplay = display.value;
            if (currDisplay == null) {
                return null;
            }
            if (isCoercableComponent(currDisplay)) {
                return coerceComponent(currDisplay);
            }
            return (
                <span>
                    <component v-is={coerceComponent(currDisplay.requirement, "h3")} />
                    <div v-if={currDisplay.effectDisplay}>
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        <component v-is={coerceComponent(currDisplay.effectDisplay!, "b")} />
                    </div>
                    <div v-if={currDisplay.optionsDisplay}>
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        <component v-is={coerceComponent(currDisplay.optionsDisplay!, "span")} />
                    </div>
                </span>
            );
        });

        return {
            component,
            LinkNode,
            Visibility
        };
    }
});
</script>

<style scoped>
.milestone {
    width: calc(100% - 10px);
    min-width: 120px;
    padding-left: 5px;
    padding-right: 5px;
    min-height: 75px;
    background-color: var(--locked);
    border-width: 4px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.5);
    margin: 0;
}

.milestone.done {
    background-color: var(--bought);
    cursor: default;
}
</style>
