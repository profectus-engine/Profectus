<template>
    <Tooltip
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :display="tooltip"
    >
        <div
            :style="[{ backgroundImage: (earned && image && `url(${image})`) || '' }, style ?? []]"
            :class="{
                feature: true,
                achievement: true,
                locked: !earned,
                bought: earned,
                ...classes
            }"
        >
            <component v-if="component" :is="component" />
            <MarkNode :mark="mark" />
            <LinkNode :id="id" />
        </div>
    </Tooltip>
</template>

<script lang="ts">
import { CoercableComponent, Visibility } from "@/features/feature";
import { coerceComponent } from "@/util/vue";
import { computed, defineComponent, PropType, StyleValue, toRefs } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

export default defineComponent({
    props: {
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        display: [Object, String] as PropType<CoercableComponent>,
        tooltip: [Object, String] as PropType<CoercableComponent>,
        earned: {
            type: Boolean,
            required: true
        },
        image: String,
        style: Object as PropType<StyleValue>,
        classes: Object as PropType<Record<string, boolean>>,
        mark: [Boolean, String],
        id: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const { display } = toRefs(props);

        return {
            component: computed(() => {
                return display.value && coerceComponent(display.value);
            }),
            LinkNode,
            MarkNode,
            Visibility
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
</style>
