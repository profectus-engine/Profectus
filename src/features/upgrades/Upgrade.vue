<template>
    <button
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            {
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined
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
import Node from "components/Node.vue";
import MarkNode from "components/MarkNode.vue";
import { jsx, StyleValue, Visibility } from "features/feature";
import { displayResource, Resource } from "features/resources/resource";
import { GenericUpgrade } from "features/upgrades/upgrade";
import { DecimalSource } from "util/bignum";
import { coerceComponent, isCoercableComponent, processedPropType, unwrapRef } from "util/vue";
import {
    Component,
    defineComponent,
    PropType,
    shallowRef,
    toRefs,
    unref,
    UnwrapRef,
    watchEffect
} from "vue";

export default defineComponent({
    props: {
        display: {
            type: processedPropType<UnwrapRef<GenericUpgrade["display"]>>(String, Object, Function),
            required: true
        },
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        resource: Object as PropType<Resource>,
        cost: processedPropType<DecimalSource>(String, Object, Number),
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
        const { display, cost } = toRefs(props);

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
            const currCost = unwrapRef(cost);
            const Title = coerceComponent(currDisplay.title || "", "h3");
            const Description = coerceComponent(currDisplay.description, "div");
            const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
            component.value = coerceComponent(
                jsx(() => (
                    <span>
                        {currDisplay.title ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                        {currDisplay.effectDisplay ? (
                            <div>
                                Currently: <EffectDisplay />
                            </div>
                        ) : null}
                        {props.resource != null ? (
                            <>
                                <br />
                                Cost: {props.resource &&
                                    displayResource(props.resource, currCost)}{" "}
                                {props.resource?.displayName}
                            </>
                        ) : null}
                    </span>
                ))
            );
        });

        return {
            component,
            unref,
            Visibility
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
</style>
