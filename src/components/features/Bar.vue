<template>
    <div
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="[{ width: width + 'px', height: height + 'px' }, style ?? {}]"
        :class="{
            bar: true,
            ...classes
        }"
    >
        <div
            class="overlayTextContainer border"
            :style="[{ width: width + 'px', height: height + 'px' }, borderStyle ?? {}]"
        >
            <component v-if="component" class="overlayText" :style="textStyle" :is="component" />
        </div>
        <div
            class="border"
            :style="[
                { width: width + 'px', height: height + 'px' },
                style ?? {},
                baseStyle ?? {},
                borderStyle ?? {}
            ]"
        >
            <div class="fill" :style="[barStyle, style ?? {}, fillStyle ?? {}]" />
        </div>
        <MarkNode :mark="mark" />
        <LinkNode :id="id" />
    </div>
</template>

<script setup lang="ts">
import { Direction, GenericBar } from "@/features/bar";
import { FeatureComponent, Visibility } from "@/features/feature";
import Decimal from "@/util/bignum";
import { coerceComponent } from "@/util/vue";
import { computed, CSSProperties, toRefs, unref } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

const props = toRefs(defineProps<FeatureComponent<GenericBar>>());

const normalizedProgress = computed(() => {
    let progress =
        props.progress.value instanceof Decimal
            ? props.progress.value.toNumber()
            : Number(props.progress.value);
    return (1 - Math.min(Math.max(progress, 0), 1)) * 100;
});

const barStyle = computed(() => {
    const barStyle: Partial<CSSProperties> = {
        width: unref(props.width) + 0.5 + "px",
        height: unref(props.height) + 0.5 + "px"
    };
    switch (unref(props.direction)) {
        case Direction.Up:
            barStyle.clipPath = `inset(${normalizedProgress.value}% 0% 0% 0%)`;
            barStyle.width = unref(props.width) + 1 + "px";
            break;
        case Direction.Down:
            barStyle.clipPath = `inset(0% 0% ${normalizedProgress.value}% 0%)`;
            barStyle.width = unref(props.width) + 1 + "px";
            break;
        case Direction.Right:
            barStyle.clipPath = `inset(0% ${normalizedProgress.value}% 0% 0%)`;
            break;
        case Direction.Left:
            barStyle.clipPath = `inset(0% 0% 0% ${normalizedProgress.value} + '%)`;
            break;
        case Direction.Default:
            barStyle.clipPath = "inset(0% 50% 0% 0%)";
            break;
    }
    return barStyle;
});

const component = computed(() => {
    const display = props.display.value;
    return display && coerceComponent(display);
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
}
</style>
