<template>
    <button
        v-if="isVisible(visibility)"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        @click="purchase"
        :class="{
            feature: true,
            upgrade: true,
            can: unref(canPurchase),
            locked: !unref(canPurchase),
            bought: unref(bought),
            ...unref(classes)
        }"
        :disabled="!unref(canPurchase)"
    >
        <component v-if="unref(component)" :is="unref(component)" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </button>
</template>

<script lang="tsx">
import "components/common/features.css";
import MarkNode from "components/MarkNode.vue";
import Node from "components/Node.vue";
import type { StyleValue } from "features/feature";
import { isHidden, isVisible, jsx, Visibility } from "features/feature";
import type { GenericUpgrade } from "features/upgrades/upgrade";
import { displayRequirements, Requirements } from "game/requirements";
import { coerceComponent, isCoercableComponent, processedPropType, unwrapRef } from "util/vue";
import type { Component, PropType, UnwrapRef } from "vue";
import { defineComponent, shallowRef, toRefs, unref, watchEffect } from "vue";

export default defineComponent({
    props: {
        display: {
            type: processedPropType<UnwrapRef<GenericUpgrade["display"]>>(String, Object, Function),
            required: true
        },
        visibility: {
            type: processedPropType<Visibility | boolean>(Number, Boolean),
            required: true
        },
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        requirements: {
            type: Object as PropType<Requirements>,
            required: true
        },
        canPurchase: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        bought: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        mark: processedPropType<boolean | string>(Boolean, String),
        id: {
            type: String,
            required: true
        },
        purchase: {
            type: Function as PropType<VoidFunction>,
            required: true
        }
    },
    components: {
        Node,
        MarkNode
    },
    setup(props) {
        const { display, requirements, bought } = toRefs(props);

        const component = shallowRef<Component | string>("");

        watchEffect(() => {
            const currDisplay = unwrapRef(display);
            if (currDisplay == null) {
                component.value = "";
                return;
            }
            if (isCoercableComponent(currDisplay)) {
                component.value = coerceComponent(currDisplay);
                return;
            }
            const Title = coerceComponent(currDisplay.title || "", "h3");
            const Description = coerceComponent(currDisplay.description, "div");
            const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
            component.value = coerceComponent(
                jsx(() => (
                    <span>
                        {currDisplay.title != null ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                        {currDisplay.effectDisplay != null ? (
                            <div>
                                Currently: <EffectDisplay />
                            </div>
                        ) : null}
                        {bought.value ? null : <><br />{displayRequirements(requirements.value)}</>}
                    </span>
                ))
            );
        });

        return {
            component,
            unref,
            Visibility,
            isVisible,
            isHidden
        };
    }
});
</script>

<style scoped>
.upgrade {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}

.upgrade > * {
    pointer-events: none;
}
</style>
