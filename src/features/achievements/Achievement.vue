<template>
    <div
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            {
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined,
                backgroundImage: (earned && image && `url(${image})`) || ''
            },
            unref(style) ?? []
        ]"
        :class="{
            feature: true,
            achievement: true,
            locked: !unref(earned),
            bought: unref(earned),
            ...unref(classes)
        }"
    >
        <component v-if="component" :is="component" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script lang="ts">
import { CoercableComponent, Visibility } from "features/feature";
import { computeOptionalComponent, processedPropType } from "util/vue";
import { defineComponent, StyleValue, toRefs, unref } from "vue";
import Tooltip from "components/Tooltip.vue";
import Node from "components/Node.vue";
import MarkNode from "components/MarkNode.vue";
import "components/common/features.css";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        display: processedPropType<CoercableComponent>(Object, String, Function),
        earned: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        image: processedPropType<string>(String),
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        mark: processedPropType<boolean | string>(Boolean, String),
        id: {
            type: String,
            required: true
        }
    },
    components: {
        Node,
        MarkNode,
        Tooltip
    },
    setup(props) {
        const { display } = toRefs(props);

        return {
            component: computeOptionalComponent(display),
            unref,
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
