<template>
    <div
        v-if="isVisible(visibility)"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined,
                backgroundImage: (earned && image && `url(${image})`) || ''
            },
            unref(style) ?? []
        ]"
        :class="{
            feature: true,
            achievement: true,
            locked: !unref(earned),
            done: unref(earned),
            small: unref(small),
            ...unref(classes)
        }"
    >
        <component v-if="comp" :is="comp" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script lang="tsx">
import "components/common/features.css";
import MarkNode from "components/MarkNode.vue";
import Node from "components/Node.vue";
import { isHidden, isVisible, jsx, Visibility } from "features/feature";
import { displayRequirements, Requirements } from "game/requirements";
import { coerceComponent, isCoercableComponent, processedPropType, unwrapRef } from "util/vue";
import { Component, defineComponent, shallowRef, StyleValue, toRefs, unref, UnwrapRef, watchEffect } from "vue";
import { GenericAchievement } from "./achievement";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility | boolean>(Number, Boolean),
            required: true
        },
        display: processedPropType<UnwrapRef<GenericAchievement["display"]>>(Object, String, Function),
        earned: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        requirements: processedPropType<Requirements>(Object, Array),
        image: processedPropType<string>(String),
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        mark: processedPropType<boolean | string>(Boolean, String),
        small: processedPropType<boolean>(Boolean),
        id: {
            type: String,
            required: true
        }
    },
    components: {
        Node,
        MarkNode
    },
    setup(props) {
        const { display, requirements, earned } = toRefs(props);

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
            const Requirement = coerceComponent(currDisplay.requirement ? currDisplay.requirement : jsx(() => displayRequirements(unwrapRef(requirements) ?? [])), "h3");
            const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "", "b");
            const OptionsDisplay = unwrapRef(earned) ?
                coerceComponent(currDisplay.optionsDisplay || "", "span") :
                "";
            comp.value = coerceComponent(
                jsx(() => (
                    <span>
                        <Requirement />
                        {currDisplay.effectDisplay != null ? (
                            <div>
                                <EffectDisplay />
                            </div>
                        ) : null}
                        {currDisplay.optionsDisplay != null ? (
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
            Visibility,
            isVisible,
            isHidden
        };
    }
});
</script>

<style scoped>
.achievement {
    height: 90px;
    width: 90px;
    font-size: 10px;
    color: white;
    text-shadow: 0 0 2px #000000;
}

.achievement:not(.small) {
    height: unset;
    width: calc(100% - 10px);
    min-width: 120px;
    padding-left: 5px;
    padding-right: 5px;
    background-color: var(--locked);
    border-width: 4px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.5);
    font-size: unset;
    text-shadow: unset;
}

.achievement.done {
    background-color: var(--bought);
    cursor: default;
}

.achievement :deep(.equal-spaced) {
    display: flex;
    justify-content: center;
}

.achievement :deep(.equal-spaced > *) {
    margin: auto;
}
</style>
