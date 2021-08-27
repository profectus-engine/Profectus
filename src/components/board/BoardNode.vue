<template>
    <g
        class="boardnode"
        :class="node.type"
        :style="{ opacity: dragging?.id === node.id && hasDragged ? 0.5 : 1 }"
        :transform="`translate(${position.x},${position.y})`"
    >
        <transition name="actions" appear>
            <g v-if="selected && actions">
                <!-- TODO move to separate file -->
                <g
                    v-for="(action, index) in actions"
                    :key="action.id"
                    class="action"
                    :class="{ selected: selectedAction?.id === action.id }"
                    :transform="
                        `translate(
                            ${(-size - 30) *
                                Math.sin(((actions.length - 1) / 2 - index) * actionDistance)},
                            ${(size + 30) *
                                Math.cos(((actions.length - 1) / 2 - index) * actionDistance)}
                        )`
                    "
                    @mousedown="e => performAction(e, action)"
                    @touchstart="e => performAction(e, action)"
                    @mouseup="e => actionMouseUp(e, action)"
                    @touchend.stop="e => actionMouseUp(e, action)"
                >
                    <circle
                        :fill="
                            action.fillColor
                                ? typeof action.fillColor === 'function'
                                    ? action.fillColor(node)
                                    : action.fillColor
                                : fillColor
                        "
                        r="20"
                        :stroke-width="selectedAction?.id === action.id ? 4 : 0"
                        :stroke="outlineColor"
                    />
                    <text :fill="titleColor" class="material-icons">{{
                        typeof action.icon === "function" ? action.icon(node) : action.icon
                    }}</text>
                </g>
            </g>
        </transition>

        <g
            class="node-container"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave"
            @mousedown="mouseDown"
            @touchstart="mouseDown"
            @mouseup="mouseUp"
            @touchend="mouseUp"
        >
            <g v-if="shape === Shape.Circle">
                <circle
                    v-if="canAccept"
                    class="receiver"
                    :r="size + 8"
                    :fill="backgroundColor"
                    :stroke="receivingNode ? '#0F0' : '#0F03'"
                    :stroke-width="2"
                />

                <circle
                    class="body"
                    :r="size"
                    :fill="fillColor"
                    :stroke="outlineColor"
                    :stroke-width="4"
                />

                <circle
                    class="progressFill"
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
                    class="receiver"
                    :width="size * sqrtTwo + 16"
                    :height="size * sqrtTwo + 16"
                    :transform="
                        `translate(${-(size * sqrtTwo + 16) / 2}, ${-(size * sqrtTwo + 16) / 2})`
                    "
                    :fill="backgroundColor"
                    :stroke="receivingNode ? '#0F0' : '#0F03'"
                    :stroke-width="2"
                />

                <rect
                    class="body"
                    :width="size * sqrtTwo"
                    :height="size * sqrtTwo"
                    :transform="`translate(${(-size * sqrtTwo) / 2}, ${(-size * sqrtTwo) / 2})`"
                    :fill="fillColor"
                    :stroke="outlineColor"
                    :stroke-width="4"
                />

                <rect
                    v-if="progressDisplay === ProgressDisplay.Fill"
                    class="progressFill"
                    :width="Math.max(size * sqrtTwo * progress - 2, 0)"
                    :height="Math.max(size * sqrtTwo * progress - 2, 0)"
                    :transform="
                        `translate(${-Math.max(size * sqrtTwo * progress - 2, 0) / 2}, ${-Math.max(
                            size * sqrtTwo * progress - 2,
                            0
                        ) / 2})`
                    "
                    :fill="progressColor"
                />
                <rect
                    v-else
                    class="progressDiamond"
                    :width="size * sqrtTwo + 9"
                    :height="size * sqrtTwo + 9"
                    :transform="
                        `translate(${-(size * sqrtTwo + 9) / 2}, ${-(size * sqrtTwo + 9) / 2})`
                    "
                    fill="transparent"
                    :stroke-dasharray="(size * sqrtTwo + 9) * 4"
                    :stroke-width="5"
                    :stroke-dashoffset="
                        (size * sqrtTwo + 9) * 4 - progress * (size * sqrtTwo + 9) * 4
                    "
                    :stroke="progressColor"
                />
            </g>

            <text :fill="titleColor" class="node-title">{{ title }}</text>
        </g>

        <transition name="fade" appear>
            <g v-if="label">
                <text
                    :fill="label.color || titleColor"
                    class="node-title"
                    :class="{ pulsing: label.pulsing }"
                    :y="-size - 20"
                    >{{ label.text }}
                </text>
            </g>
        </transition>

        <transition name="fade" appear>
            <text
                v-if="selected && selectedAction"
                :fill="titleColor"
                class="node-title"
                :y="size + 75"
                >Tap again to confirm</text
            >
        </transition>
    </g>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { ProgressDisplay, Shape } from "@/game/enums";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { BoardNode, BoardNodeAction, NodeLabel, NodeType } from "@/typings/features/board";
import { getNodeTypeProperty } from "@/util/features";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "BoardNode",
    data() {
        return {
            ProgressDisplay,
            Shape,
            hovering: false,
            sqrtTwo: Math.sqrt(2)
        };
    },
    emits: ["mouseDown", "endDragging"],
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
        hasDragged: {
            type: Boolean,
            default: false
        },
        receivingNode: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        board() {
            return layers[this.nodeType.layer].boards!.data[this.nodeType.id];
        },
        selected() {
            return this.board.selectedNode === this.node;
        },
        selectedAction() {
            return this.board.selectedAction;
        },
        actions(): BoardNodeAction[] | null | undefined {
            const actions = getNodeTypeProperty(this.nodeType, this.node, "actions") as
                | BoardNodeAction[]
                | null
                | undefined;
            if (actions) {
                return actions.filter(action => {
                    if (action.enabled == null) {
                        return true;
                    }
                    if (typeof action.enabled === "function") {
                        return action.enabled();
                    }
                    return action.enabled;
                });
            }
            return null;
        },
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
            } else if (this.hovering || this.selected) {
                size *= 1.15;
            }
            return size;
        },
        title(): string {
            return getNodeTypeProperty(this.nodeType, this.node, "title");
        },
        label(): NodeLabel | null | undefined {
            return getNodeTypeProperty(this.nodeType, this.node, "label");
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
            if (this.dragging == null || !this.hasDragged) {
                return false;
            }
            return typeof this.nodeType.canAccept === "boolean"
                ? this.nodeType.canAccept
                : this.nodeType.canAccept(this.node, this.dragging);
        },
        actionDistance(): number {
            return getNodeTypeProperty(this.nodeType, this.node, "actionDistance");
        }
    },
    methods: {
        mouseDown(e: MouseEvent | TouchEvent) {
            this.$emit("mouseDown", e, this.node.id, this.draggable);
        },
        mouseUp() {
            if (!this.hasDragged) {
                this.nodeType.onClick?.(this.node);
            }
        },
        mouseEnter() {
            this.hovering = true;
        },
        mouseLeave() {
            this.hovering = false;
        },
        performAction(e: MouseEvent | TouchEvent, action: BoardNodeAction) {
            // If the onClick function made this action selected,
            // don't propagate the event (which will deselect everything)
            if (action.onClick(this.node) || this.board.selectedAction?.id === action.id) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        actionMouseUp(e: MouseEvent | TouchEvent, action: BoardNodeAction) {
            if (this.board.selectedAction?.id === action.id) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    },
    watch: {
        onDraggableChanged() {
            if (this.dragging === this.node && !this.draggable) {
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
    pointer-events: none;
}

.progressRing {
    transform: rotate(-90deg);
}

.action:not(.boardnode):hover circle,
.action:not(.boardnode).selected circle {
    r: 25;
}

.action:not(.boardnode):hover text,
.action:not(.boardnode).selected text {
    font-size: 187.5%; /* 150% * 1.25 */
}

.action:not(.boardnode) text {
    text-anchor: middle;
    dominant-baseline: central;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>

<style>
.actions-enter-from .action,
.actions-leave-to .action {
    transform: translate(0, 0);
}

.grow-enter-from .node-container,
.grow-leave-to .node-container {
    transform: scale(0);
}
</style>
