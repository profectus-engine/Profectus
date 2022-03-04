<template>
    <div
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            {
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        :class="{ feature: true, milestone: true, done: unref(earned), ...unref(classes) }"
    >
        <component :is="unref(comp)" />
        <LinkNode :id="id" />
    </div>
</template>

<script lang="tsx">
import "components/common/features.css";
import { jsx, StyleValue, Visibility } from "features/feature";
import { GenericMilestone } from "features/milestones/milestone";
import { coerceComponent, isCoercableComponent, processedPropType, unwrapRef } from "util/vue";
import { Component, defineComponent, shallowRef, toRefs, unref, UnwrapRef, watchEffect } from "vue";
import LinkNode from "../../components/links/LinkNode.vue";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        display: {
            type: processedPropType<UnwrapRef<GenericMilestone["display"]>>(
                String,
                Object,
                Function
            ),
            required: true
        },
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        earned: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    components: {
        LinkNode
    },
    setup(props) {
        const { display } = toRefs(props);

        const comp = shallowRef<Component | string>("");

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
            const Requirement = coerceComponent(currDisplay.requirement, "h3");
            const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "", "b");
            const OptionsDisplay = coerceComponent(currDisplay.optionsDisplay || "", "span");
            comp.value = coerceComponent(
                jsx(() => (
                    <span>
                        <Requirement />
                        {currDisplay.effectDisplay ? (
                            <div>
                                <EffectDisplay />
                            </div>
                        ) : null}
                        {currDisplay.optionsDisplay ? (
                            <div class="equal-spaced">
                                <OptionsDisplay />
                            </div>
                        ) : null}
                    </span>
                ))
            );
        });

        return {
            comp,
            unref,
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
    margin-top: 0;
    margin-bottom: 0;
}

.milestone.done {
    background-color: var(--bought);
    cursor: default;
}

.milestone >>> .equal-spaced {
    display: flex;
    justify-content: center;
}

.milestone >>> .equal-spaced > * {
    margin: auto;
}
</style>
