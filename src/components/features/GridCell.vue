<template>
    <button
        v-if="gridable.unlocked"
        :class="{ feature: true, tile: true, can: canClick, locked: !canClick }"
        :style="style"
        @click="gridable.click"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart="start"
        @touchend="stop"
        @touchcancel="stop"
        :disabled="!canClick"
    >
        <div v-if="title"><component :is="title" /></div>
        <component :is="display" style="white-space: pre-line;" />
        <branch-node :branches="gridable.branches" :id="id" featureType="gridable" />
    </button>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { GridCell } from "@/typings/features/grid";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "grid-cell",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        },
        cell: {
            type: [Number, String],
            required: true
        },
        size: [Number, String]
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
        gridCell(): GridCell {
            return layers[this.layer].grids!.data[this.id][this.cell] as GridCell;
        },
        canClick(): boolean {
            return this.gridCell.canClick;
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.canClick ? { backgroundColor: layers[this.layer].color } : {},
                layers[this.layer].componentStyles?.["grid-cell"],
                this.gridCell.style
            ];
        },
        title(): Component | string | null {
            if (this.gridCell.title) {
                return coerceComponent(this.gridCell.title, "h3");
            }
            return null;
        },
        display(): Component | string {
            return coerceComponent(this.gridCell.display, "div");
        }
    },
    methods: {
        start() {
            if (!this.interval && this.gridCell.click) {
                this.interval = setInterval(this.gridCell.click, 250);
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
.tile {
    min-height: 80px;
    width: 80px;
    font-size: 10px;
}
</style>
