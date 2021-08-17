<template>
    <div v-if="clickable.unlocked">
        <button
            :style="style"
            @click="clickable.click"
            @mousedown="start"
            @mouseleave="stop"
            @mouseup="stop"
            @touchstart="start"
            @touchend="stop"
            @touchcancel="stop"
            :disabled="!clickable.canClick"
            :class="{
                feature: true,
                [layer]: true,
                clickable: true,
                can: clickable.canClick,
                locked: !clickable.canClick
            }"
        >
            <div v-if="title">
                <component :is="title" />
            </div>
            <component :is="display" style="white-space: pre-line;" />
            <mark-node :mark="clickable.mark" />
            <branch-node :branches="clickable.branches" :id="id" featureType="clickable" />
        </button>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Clickable } from "@/typings/features/clickable";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "clickable",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        },
        size: String
    },
    data() {
        return {
            interval: null,
            time: 0
        } as {
            interval: number | null;
            time: number;
        };
    },
    computed: {
        clickable(): Clickable {
            return layers[this.layer].clickables!.data[this.id];
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.clickable.canClick ? { backgroundColor: layers[this.layer].color } : undefined,
                this.size ? { height: this.size, width: this.size } : undefined,
                layers[this.layer].componentStyles?.clickable,
                this.clickable.style
            ];
        },
        title(): Component | string | null {
            if (this.clickable.title) {
                return coerceComponent(this.clickable.title, "h2");
            }
            return null;
        },
        display(): Component | string {
            return coerceComponent(this.clickable.display, "div");
        }
    },
    methods: {
        start() {
            if (!this.interval && this.clickable.click) {
                this.interval = setInterval(this.clickable.click, 250);
            }
        },
        stop() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
                this.time = 0;
            }
        }
    }
});
</script>

<style scoped>
.clickable {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}
</style>
