<template>
    <div
        :style="{
            width: unref(width) + 'px',
            height: unref(height) + 'px',
        }"
        class="bar"
    >
        <div
            class="overlayTextContainer border"
            :style="[
                { width: unref(width) + 'px', height: unref(height) + 'px' },
                unref(borderStyle) ?? {}
            ]"
        >
            <span v-if="display" class="overlayText" :style="unref(textStyle)">
                <Component />
            </span>
        </div>
        <div
            class="border"
            :style="[
                { width: unref(width) + 'px', height: unref(height) + 'px' },
                unref(baseStyle) ?? {},
                unref(borderStyle) ?? {}
            ]"
        >
            <div class="fill" :style="[barStyle, unref(fillStyle) ?? {}]" />
        </div>
    </div>
</template>

<script setup lang="ts">
import Decimal, { DecimalSource } from "util/bignum";
import { Direction } from "util/common";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import type { CSSProperties, MaybeRef } from "vue";
import { computed, unref } from "vue";

const props = defineProps<{
    width: MaybeRef<number>;
    height: MaybeRef<number>;
    direction: MaybeRef<Direction>;
    borderStyle?: MaybeRef<CSSProperties>;
    baseStyle?: MaybeRef<CSSProperties>;
    textStyle?: MaybeRef<CSSProperties>;
    fillStyle?: MaybeRef<CSSProperties>;
    progress: MaybeRef<DecimalSource>;
    display?: MaybeGetter<Renderable>;
}>();

const normalizedProgress = computed(() => {
    let progressNumber =
        props.progress instanceof Decimal
            ? props.progress.toNumber()
            : Number(props.progress);
    return (1 - Math.min(Math.max(progressNumber, 0), 1)) * 100;
});

const barStyle = computed(() => {
    const barStyle: Partial<CSSProperties> = {
        width: unref(props.width) + 0.5 + "px",
        height: unref(props.height) + 0.5 + "px"
    };
    switch (props.direction) {
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
            barStyle.clipPath = `inset(0% 0% 0% ${normalizedProgress.value}%)`;
            break;
        case Direction.Default:
            barStyle.clipPath = "inset(0% 50% 0% 0%)";
            break;
    }
    return barStyle;
});

const Component = () => props.display ? render(props.display) : null;
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
