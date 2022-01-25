<template>
    <button
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="style"
        @click="purchase"
        :class="{
            feature: true,
            upgrade: true,
            can: canPurchase && !bought,
            locked: !canPurchase && !bought,
            bought,
            ...classes
        }"
        :disabled="!canPurchase && !bought"
    >
        <component v-if="component" :is="component" />
        <MarkNode :mark="mark" />
        <LinkNode :id="id" />
    </button>
</template>

<script lang="tsx">
import { StyleValue, Visibility } from "@/features/feature";
import { displayResource, Resource } from "@/features/resource";
import { GenericUpgrade } from "@/features/upgrade";
import { DecimalSource } from "@/lib/break_eternity";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, defineComponent, PropType, Ref, toRef, toRefs, unref, UnwrapRef } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

export default defineComponent({
    props: {
        display: {
            type: Object as PropType<UnwrapRef<GenericUpgrade["display"]>>,
            required: true
        },
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        style: Object as PropType<StyleValue>,
        classes: Object as PropType<Record<string, boolean>>,
        resource: {
            type: Object as PropType<Resource>,
            required: true
        },
        cost: {
            type: Object as PropType<DecimalSource>,
            required: true
        },
        canPurchase: {
            type: Boolean,
            required: true
        },
        bought: {
            type: Boolean,
            required: true
        },
        mark: [Boolean, String],
        id: {
            type: String,
            required: true
        },
        purchase: {
            type: Function as PropType<VoidFunction>,
            required: true
        }
    },
    setup(props) {
        const { display, cost } = toRefs(props);
        const resource = toRef(props, "resource") as unknown as Ref<Resource>;

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
                    <div v-if={currDisplay.title}>
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        <component v-is={coerceComponent(currDisplay.title!, "h2")} />
                    </div>
                    <component v-is={coerceComponent(currDisplay.description, "div")} />
                    <div v-if={currDisplay.effectDisplay}>
                        <br />
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        Currently: <component v-is={coerceComponent(currDisplay.effectDisplay!)} />
                    </div>
                    <template v-if={resource.value != null && cost.value != null}>
                        <br />
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        Cost: {displayResource(resource.value, cost.value)}{" "}
                        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                        {resource.value.displayName}
                    </template>
                </span>
            );
        });

        return {
            component,
            LinkNode,
            MarkNode,
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
