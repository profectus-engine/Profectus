<template>
    <g
        class="boardnode"
        :style="{ opacity: dragging?.id === node.id ? 0.5 : 1 }"
        :transform="`translate(${position.x},${position.y})`"
        @mouseenter="mouseEnter"
        @mouseleave="mouseLeave"
        @mousedown="mouseDown"
    >
        <g v-if="shape === Shape.Circle">
            <circle
                v-if="canAccept"
                :r="size + 8"
                :fill="backgroundColor"
                :stroke="receivingNode ? '#0F0' : '#0F03'"
                :stroke-width="2"
            />

            <circle :r="size" :fill="fillColor" :stroke="outlineColor" :stroke-width="4" />

            <circle
                v-if="progressDisplay === ProgressDisplay.Fill"
                :r="Math.max(size * progress - 2, 0)"
                :fill="progressColor"
            />
            <circle
                v-else
                :r="size + 4.5"
                class="progressRing"
                fill="transparent"
                :stroke-dasharray="(size + 4.5) * 2 * Math.PI"
                :stroke-width="5"
                :stroke-dashoffset="
                    (size + 4.5) * 2 * Math.PI - progress * (size + 4.5) * 2 * Math.PI
                "
                :stroke="progressColor"
            />
        </g>
        <g v-else-if="shape === Shape.Diamond" transform="rotate(45, 0, 0)">
            <rect
                v-if="canAccept"
                :width="size + 16"
                :height="size + 16"
                :transform="`translate(${-(size + 16) / 2}, ${-(size + 16) / 2})`"
                :fill="backgroundColor"
                :stroke="receivingNode ? '#0F0' : '#0F03'"
                :stroke-width="2"
            />

            <rect
                :width="size"
                :height="size"
                :transform="`translate(${-size / 2}, ${-size / 2})`"
                :fill="fillColor"
                :stroke="outlineColor"
                :stroke-width="4"
            />

            <rect
                v-if="progressDisplay === ProgressDisplay.Fill"
                :width="Math.max(size * progress - 2, 0)"
                :height="Math.max(size * progress - 2, 0)"
                :transform="
                    `translate(${-Math.max(size * progress - 2, 0) / 2}, ${-Math.max(
                        size * progress - 2,
                        0
                    ) / 2})`
                "
                :fill="progressColor"
            />
            <rect
                v-else
                :width="size + 9"
                :height="size + 9"
                :transform="`translate(${-(size + 9) / 2}, ${-(size + 9) / 2})`"
                fill="transparent"
                :stroke-dasharray="(size + 9) * 4"
                :stroke-width="5"
                :stroke-dashoffset="(size + 9) * 4 - progress * (size + 9) * 4"
                :stroke="progressColor"
            />
        </g>

        <text :fill="titleColor" class="node-title">{{ title }}</text>
    </g>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { ProgressDisplay, Shape } from "@/game/enums";
import player from "@/game/player";
import { BoardNode, NodeType } from "@/typings/features/board";
import { getNodeTypeProperty } from "@/util/features";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "BoardNode",
    mixins: [InjectLayerMixin],
    data() {
        return {
            ProgressDisplay,
            Shape,
            lastMousePosition: { x: 0, y: 0 },
            hovering: false
        };
    },
    emits: ["startDragging", "endDragging"],
    props: {
        node: {
            type: Object as PropType<BoardNode>,
            required: true
        },
        nodeType: {
            type: Object as PropType<NodeType>,
            required: true
        },
        dragging: {
            type: Object as PropType<BoardNode>
        },
        dragged: {
            type: Object as PropType<{ x: number; y: number }>,
            required: true
        },
        receivingNode: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        draggable(): boolean {
            return getNodeTypeProperty(this.nodeType, this.node, "draggable");
        },
        position(): { x: number; y: number } {
            return this.draggable && this.dragging?.id === this.node.id
                ? {
                      x: this.node.position.x + Math.round(this.dragged.x / 25) * 25,
                      y: this.node.position.y + Math.round(this.dragged.y / 25) * 25
                  }
                : this.node.position;
        },
        shape(): Shape {
            return getNodeTypeProperty(this.nodeType, this.node, "shape");
        },
        size(): number {
            let size: number = getNodeTypeProperty(this.nodeType, this.node, "size");
            if (this.receivingNode) {
                size *= 1.25;
            } else if (this.hovering) {
                size *= 1.15;
            }
            return size;
        },
        title(): string {
            return getNodeTypeProperty(this.nodeType, this.node, "title");
        },
        progress(): number {
            return getNodeTypeProperty(this.nodeType, this.node, "progress") || 0;
        },
        backgroundColor(): string {
            return themes[player.theme].variables["--background"];
        },
        outlineColor(): string {
            return (
                getNodeTypeProperty(this.nodeType, this.node, "outlineColor") ||
                themes[player.theme].variables["--separator"]
            );
        },
        fillColor(): string {
            return (
                getNodeTypeProperty(this.nodeType, this.node, "fillColor") ||
                themes[player.theme].variables["--secondary-background"]
            );
        },
        progressColor(): string {
            return getNodeTypeProperty(this.nodeType, this.node, "progressColor") || "none";
        },
        titleColor(): string {
            return (
                getNodeTypeProperty(this.nodeType, this.node, "titleColor") ||
                themes[player.theme].variables["--color"]
            );
        },
        progressDisplay(): ProgressDisplay {
            return (
                getNodeTypeProperty(this.nodeType, this.node, "progressDisplay") ||
                ProgressDisplay.Outline
            );
        },
        canAccept(): boolean {
            if (this.dragging == null) {
                return false;
            }
            return typeof this.nodeType.canAccept === "boolean"
                ? this.nodeType.canAccept
                : this.nodeType.canAccept(this.node, this.dragging);
        }
    },
    methods: {
        mouseDown(e: MouseEvent) {
            if (this.draggable) {
                this.$emit('startDragging', e, this.node.id);
            }
        },
        mouseEnter() {
            this.hovering = true;
        },
        mouseLeave() {
            this.hovering = false;
        }
    },
    watch: {
        onDraggableChanged() {
            if (this.dragging && !this.draggable) {
                this.$emit("endDragging", this.node.id);
            }
        }
    }
});
</script>

<style scoped>
.boardnode {
    cursor: pointer;
    transition-duration: 0s;
}

.node-title {
    text-anchor: middle;
    dominant-baseline: middle;
    font-family: monospace;
    font-size: 200%;
}

.progressRing {
    transform: rotate(-90deg);
}
</style>
