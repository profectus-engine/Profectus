<template>
    <line
        :stroke="stroke"
        :stroke-width="strokeWidth"
        v-bind="typeof options === 'string' ? [] : options"
        :x1="startPosition.x"
        :y1="startPosition.y"
        :x2="endPosition.x"
        :y2="endPosition.y"
    />
</template>

<script lang="ts">
import { BranchNode, BranchOptions, Position } from "@/typings/branches";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "branch-line",
    props: {
        options: {
            type: [String, Object] as PropType<string | BranchOptions>,
            required: true
        },
        startNode: {
            type: Object as PropType<BranchNode>,
            required: true
        },
        endNode: {
            type: Object as PropType<BranchNode>,
            required: true
        }
    },
    computed: {
        stroke(): string {
            if (typeof this.options === "string" || !("stroke" in this.options)) {
                return "white";
            }
            return this.options.stroke!;
        },
        strokeWidth(): number | string {
            if (typeof this.options === "string" || !("strokeWidth" in this.options)) {
                return "15";
            }
            return this.options["strokeWidth"]!;
        },
        startPosition(): Position {
            const position = { x: this.startNode.x || 0, y: this.startNode.y || 0 };
            if (typeof this.options !== "string" && "startOffset" in this.options) {
                position.x += this.options.startOffset?.x || 0;
                position.y += this.options.startOffset?.y || 0;
            }
            return position;
        },
        endPosition(): Position {
            const position = { x: this.endNode.x || 0, y: this.endNode.y || 0 };
            if (typeof this.options !== "string" && "endOffset" in this.options) {
                position.x += this.options.endOffset?.x || 0;
                position.y += this.options.endOffset?.y || 0;
            }
            return position;
        }
    }
});
</script>

<style scoped></style>
