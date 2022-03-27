<template>
    <button
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            { visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined },
            unref(style) ?? []
        ]"
        @click="onClick"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart="start"
        @touchend="stop"
        @touchcancel="stop"
        :class="{
            feature: true,
            clickable: true,
            can: unref(canClick),
            locked: !unref(canClick),
            small,
            ...unref(classes)
        }"
    >
        <component v-if="unref(comp)" :is="unref(comp)" />
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </button>
</template>

<script lang="tsx">
import "components/common/features.css";
import Node from "components/Node.vue";
import MarkNode from "components/MarkNode.vue";
import { GenericClickable } from "features/clickables/clickable";
import { jsx, StyleValue, Visibility } from "features/feature";
import {
    coerceComponent,
    isCoercableComponent,
    processedPropType,
    setupHoldToClick,
    unwrapRef
} from "util/vue";
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
            type: processedPropType<UnwrapRef<GenericClickable["display"]>>(
                Object,
                String,
                Function
            ),
            required: true
        },
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        style: processedPropType<StyleValue>(Object, String, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        onClick: Function as PropType<(e?: MouseEvent | TouchEvent) => void>,
        onHold: Function as PropType<VoidFunction>,
        canClick: {
            type: processedPropType<boolean>(Boolean),
            required: true
        },
        small: Boolean,
        mark: processedPropType<boolean | string>(Boolean, String),
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
        const { display, onClick, onHold } = toRefs(props);

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
            const Title = coerceComponent(currDisplay.title || "", "h3");
            const Description = coerceComponent(currDisplay.description, "div");
            comp.value = coerceComponent(
                jsx(() => (
                    <span>
                        {currDisplay.title ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                    </span>
                ))
            );
        });

        const { start, stop } = setupHoldToClick(onClick, onHold);

        return {
            start,
            stop,
            comp,
            Visibility,
            unref
        };
    }
});
</script>

<style scoped>
.clickable {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}

.clickable.small {
    min-height: unset;
}
</style>
