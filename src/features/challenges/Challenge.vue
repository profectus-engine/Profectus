<template>
    <div
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            {
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined
            },
            notifyStyle,
            unref(style) ?? {}
        ]"
        :class="{
            feature: true,
            challenge: true,
            done: unref(completed),
            canStart: unref(canStart) && !unref(maxed),
            maxed: unref(maxed),
            ...unref(classes)
        }"
    >
        <button
            class="toggleChallenge"
            @click="toggle"
            :disabled="!unref(canStart) || unref(maxed)"
        >
            {{ buttonText }}
        </button>
        <component v-if="unref(comp)" :is="unref(comp)" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script lang="tsx">
import "components/common/features.css";
import { GenericChallenge } from "features/challenges/challenge";
import { jsx, StyleValue, Visibility } from "features/feature";
import { getHighNotifyStyle, getNotifyStyle } from "game/notifications";
import { coerceComponent, isCoercableComponent, processedPropType, unwrapRef } from "util/vue";
import {
    Component,
    computed,
    defineComponent,
    PropType,
    shallowRef,
    toRefs,
    unref,
    UnwrapRef,
    watchEffect
} from "vue";
import Node from "components/Node.vue";
import MarkNode from "components/MarkNode.vue";

export default defineComponent({
    props: {
        active: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        maxed: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        canComplete: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        display: processedPropType<UnwrapRef<GenericChallenge["display"]>>(
            String,
            Object,
            Function
        ),
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        completed: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        canStart: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        mark: processedPropType<boolean | string>(Boolean, String),
        id: {
            type: String,
            required: true
        },
        toggle: {
            type: Function as PropType<VoidFunction>,
            required: true
        }
    },
    components: {
        MarkNode,
        Node
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

        const comp = shallowRef<Component | string>("");

        const notifyStyle = computed(() => {
            const currActive = unwrapRef(active);
            const currCanComplete = unwrapRef(canComplete);
            if (currActive) {
                if (currCanComplete) {
                    return getHighNotifyStyle();
                }
                return getNotifyStyle();
            }
            return {};
        });

        watchEffect(() => {
            const currDisplay = unwrapRef(display);
            if (currDisplay == null) {
                comp.value = "";
                return;
            }
            if (isCoercableComponent(currDisplay)) {
                comp.value = coerceComponent(currDisplay);
                return;
            }
            const Title = coerceComponent(currDisplay.title || "", "h3");
            const Description = coerceComponent(currDisplay.description, "div");
            const Goal = coerceComponent(currDisplay.goal || "");
            const Reward = coerceComponent(currDisplay.reward || "");
            const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
            comp.value = coerceComponent(
                jsx(() => (
                    <span>
                        {currDisplay.title ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                        {currDisplay.goal ? (
                            <div>
                                <br />
                                Goal: <Goal />
                            </div>
                        ) : null}
                        {currDisplay.reward ? (
                            <div>
                                <br />
                                Reward: <Reward />
                            </div>
                        ) : null}
                        {currDisplay.effectDisplay ? (
                            <div>
                                Currently: <EffectDisplay />
                            </div>
                        ) : null}
                    </span>
                ))
            );
        });

        return {
            buttonText,
            notifyStyle,
            comp,
            Visibility,
            unref
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
