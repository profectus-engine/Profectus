<template>
    <div
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="style"
        :class="{
            feature: true,
            challenge: true,
            resetNotify: active,
            notify: active && canComplete,
            done: completed,
            canStart,
            maxed,
            ...classes
        }"
    >
        <button class="toggleChallenge" @click="toggle">
            {{ buttonText }}
        </button>
        <component v-if="component" :is="component" />
        <MarkNode :mark="mark" />
        <LinkNode :id="id" />
    </div>
</template>

<script lang="tsx">
import { GenericChallenge } from "@/features/challenge";
import { StyleValue, Visibility } from "@/features/feature";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, defineComponent, PropType, toRefs, UnwrapRef } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

export default defineComponent({
    props: {
        active: {
            type: Boolean,
            required: true
        },
        maxed: {
            type: Boolean,
            required: true
        },
        canComplete: {
            type: Boolean,
            required: true
        },
        display: Object as PropType<UnwrapRef<GenericChallenge["display"]>>,
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        style: Object as PropType<StyleValue>,
        classes: Object as PropType<Record<string, boolean>>,
        completed: {
            type: Boolean,
            required: true
        },
        canStart: {
            type: Boolean,
            required: true
        },
        mark: [Boolean, String],
        id: {
            type: String,
            required: true
        },
        toggle: {
            type: Function as PropType<VoidFunction>,
            required: true
        }
    },
    setup(props) {
        const { active, maxed, canComplete, display } = toRefs(props);

        const buttonText = computed(() => {
            if (active.value) {
                return canComplete.value ? "Finish" : "Exit Early";
            }
            if (maxed.value) {
                return "Completed";
            }
            return "Start";
        });

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
                    <template v-if={currDisplay.title}>
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        <component v-is={coerceComponent(currDisplay.title!, "h3")} />
                    </template>
                    <component v-is={coerceComponent(currDisplay.description, "div")} />
                    <div v-if={currDisplay.goal}>
                        <br />
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        Goal: <component v-is={coerceComponent(currDisplay.goal!)} />
                    </div>
                    <div v-if={currDisplay.reward}>
                        <br />
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        Reward: <component v-is={coerceComponent(currDisplay.reward!)} />
                    </div>
                    <div v-if={currDisplay.effectDisplay}>
                        Currently:{" "}
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        <component v-is={coerceComponent(currDisplay.effectDisplay!)} />
                    </div>
                </span>
            );
        });

        return {
            buttonText,
            component,
            MarkNode,
            LinkNode,
            Visibility
        };
    }
});
</script>

<style scoped>
.challenge {
    background-color: var(--locked);
    width: 300px;
    min-height: 300px;
    color: black;
    font-size: 15px;
    display: flex;
    flex-flow: column;
    align-items: center;
}

.challenge.done {
    background-color: var(--bought);
}

.challenge button {
    min-height: 50px;
    width: 120px;
    border-radius: var(--border-radius);
    box-shadow: none !important;
    background: transparent;
}

.challenge.canStart button {
    cursor: pointer;
    background-color: var(--layer-color);
}
</style>
