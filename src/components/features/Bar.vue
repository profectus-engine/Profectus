<template>
    <div v-if="bar.unlocked" :style="style" :class="{ [layer]: true, bar: true }">
        <div class="overlayTextContainer border" :style="borderStyle">
            <component class="overlayText" :style="textStyle" :is="display" />
        </div>
        <div class="border" :style="backgroundStyle">
            <div class="fill" :style="fillStyle" />
        </div>
        <branch-node :branches="bar.branches" :id="id" featureType="bar" />
    </div>
</template>

<script lang="ts">
import { Direction } from "@/game/enums";
import { layers } from "@/game/layers";
import { Bar } from "@/typings/features/bar";
import Decimal from "@/util/bignum";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "bar",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        bar(): Bar {
            return layers[this.layer].bars!.data[this.id];
        },
        progress(): number {
            let progress =
                this.bar.progress instanceof Decimal
                    ? this.bar.progress.toNumber()
                    : (this.bar.progress as number);
            return (1 - Math.min(Math.max(progress, 0), 1)) * 100;
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                { width: this.bar.width + "px", height: this.bar.height + "px" },
                layers[this.layer].componentStyles?.bar,
                this.bar.style
            ];
        },
        borderStyle(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                { width: this.bar.width + "px", height: this.bar.height + "px" },
                this.bar.borderStyle
            ];
        },
        textStyle(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [this.bar.style, this.bar.textStyle];
        },
        backgroundStyle(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                { width: this.bar.width + "px", height: this.bar.height + "px" },
                this.bar.style,
                this.bar.baseStyle,
                this.bar.borderStyle
            ];
        },
        fillStyle(): Array<Partial<CSSStyleDeclaration> | undefined> {
            const fillStyle: Partial<CSSStyleDeclaration> = {
                width: this.bar.width + 0.5 + "px",
                height: this.bar.height + 0.5 + "px"
            };
            switch (this.bar.direction) {
                case Direction.Up:
                    fillStyle.clipPath = `inset(${this.progress}% 0% 0% 0%)`;
                    fillStyle.width = this.bar.width + 1 + "px";
                    break;
                case Direction.Down:
                    fillStyle.clipPath = `inset(0% 0% ${this.progress}% 0%)`;
                    fillStyle.width = this.bar.width + 1 + "px";
                    break;
                case Direction.Right:
                    fillStyle.clipPath = `inset(0% ${this.progress}% 0% 0%)`;
                    break;
                case Direction.Left:
                    fillStyle.clipPath = `inset(0% 0% 0% ${this.progress} + '%)`;
                    break;
                case Direction.Default:
                    fillStyle.clipPath = "inset(0% 50% 0% 0%)";
                    break;
            }
            return [fillStyle, this.bar.style, this.bar.fillStyle];
        },
        display(): Component | string {
            return coerceComponent(this.bar.display);
        }
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
    border-color: var(--color);
    overflow: hidden;
    mask-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA5JREFUeNpiYGBgAAgwAAAEAAGbA+oJAAAAAElFTkSuQmCC);
    margin: 0;
}

.fill {
    position: absolute;
    background-color: var(--color);
    overflow: hidden;
    margin-left: -0.5px;
    transition-duration: 0.2s;
    z-index: 2;
}
</style>
