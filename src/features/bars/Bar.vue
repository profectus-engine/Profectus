<template>
    <div
        v-if="isVisible(visibility)"
        :style="[
            {
                width: unref(width) + 'px',
                height: unref(height) + 'px',
                visibility: isHidden(visibility) ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        :class="{
            bar: true,
            ...unref(classes)
        }"
    >
        <div
            class="overlayTextContainer border"
            :style="[
                { width: unref(width) + 'px', height: unref(height) + 'px' },
                unref(borderStyle) ?? {}
            ]"
        >
            <span v-if="component" class="overlayText" :style="unref(textStyle)">
                <component :is="component" />
            </span>
        </div>
        <div
            class="border"
            :style="[
                { width: unref(width) + 'px', height: unref(height) + 'px' },
                unref(style) ?? {},
                unref(baseStyle) ?? {},
                unref(borderStyle) ?? {}
            ]"
        >
            <div class="fill" :style="[barStyle, unref(style) ?? {}, unref(fillStyle) ?? {}]" />
        </div>
        <MarkNode :mark="unref(mark)" />
        <Node :id="id" />
    </div>
</template>

<script lang="ts">
import MarkNode from "components/MarkNode.vue";
import Node from "components/Node.vue";
import { CoercableComponent, isHidden, isVisible, Visibility } from "features/feature";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { Direction } from "util/common";
import { computeOptionalComponent, processedPropType, unwrapRef } from "util/vue";
import type { CSSProperties, StyleValue } from "vue";
import { computed, defineComponent, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        progress: {
            type: processedPropType<DecimalSource>(String, Object, Number),
            required: true
        },
        width: {
            type: processedPropType<number>(Number),
            required: true
        },
        height: {
            type: processedPropType<number>(Number),
            required: true
        },
        direction: {
            type: processedPropType<Direction>(String),
            required: true
        },
        display: processedPropType<CoercableComponent>(Object, String, Function),
        visibility: {
            type: processedPropType<Visibility | boolean>(Number, Boolean),
            required: true
        },
        style: processedPropType<StyleValue>(Object, String, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        borderStyle: processedPropType<StyleValue>(Object, String, Array),
        textStyle: processedPropType<StyleValue>(Object, String, Array),
        baseStyle: processedPropType<StyleValue>(Object, String, Array),
        fillStyle: processedPropType<StyleValue>(Object, String, Array),
        mark: processedPropType<boolean | string>(Boolean, String),
        id: {
            type: String,
            required: true
        }
    },
    components: {
        MarkNode,
        Node
    },
    setup(props) {
        const { progress, width, height, direction, display } = toRefs(props);

        const normalizedProgress = computed(() => {
            let progressNumber =
                progress.value instanceof Decimal
                    ? progress.value.toNumber()
                    : Number(progress.value);
            return (1 - Math.min(Math.max(progressNumber, 0), 1)) * 100;
        });

        const barStyle = computed(() => {
            const barStyle: Partial<CSSProperties> = {
                width: unwrapRef(width) + 0.5 + "px",
                height: unwrapRef(height) + 0.5 + "px"
            };
            switch (unref(direction)) {
                case Direction.Up:
                    barStyle.clipPath = `inset(${normalizedProgress.value}% 0% 0% 0%)`;
                    barStyle.width = unwrapRef(width) + 1 + "px";
                    break;
                case Direction.Down:
                    barStyle.clipPath = `inset(0% 0% ${normalizedProgress.value}% 0%)`;
                    barStyle.width = unwrapRef(width) + 1 + "px";
                    break;
                case Direction.Right:
                    barStyle.clipPath = `inset(0% ${normalizedProgress.value}% 0% 0%)`;
                    break;
                case Direction.Left:
                    barStyle.clipPath = `inset(0% 0% 0% ${normalizedProgress.value}%)`;
                    break;
                case Direction.Default:
                    barStyle.clipPath = "inset(0% 50% 0% 0%)";
                    break;
            }
            return barStyle;
        });

        const component = computeOptionalComponent(display);

        return {
            normalizedProgress,
            barStyle,
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
.bar {
    position: relative;
    display: table;
}

.overlayTextContainer {
    position: absolute;
    border-radius: 10px;
    vertical-align: middle;
    display: flex;
    justify-content: center;
    z-index: 3;
}

.overlayText {
    z-index: 6;
}

.border {
    border: 2px solid;
    border-radius: 10px;
    border-color: var(--foreground);
    overflow: hidden;
    mask-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA5JREFUeNpiYGBgAAgwAAAEAAGbA+oJAAAAAElFTkSuQmCC);
    margin: 0;
}

.fill {
    position: absolute;
    background-color: var(--foreground);
    overflow: hidden;
    margin-left: -0.5px;
    transition-duration: 0.2s;
    z-index: 2;
    transition-duration: 0.05s;
}
</style>
