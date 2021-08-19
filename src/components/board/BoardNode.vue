<template>
    <g
        class="boardnode"
        :style="{ opacity: dragging ? 0.5 : 1 }"
        :transform="`translate(${position.x},${position.y})`"
        @mousedown="mouseDown"
    >
        <circle :r="size + 8" :fill="backgroundColor" stroke="#0F03" :stroke-width="2" />

        <circle :r="size" :fill="fillColor" :stroke="outlineColor" :stroke-width="4" />

        <circle
            v-if="progressDisplay === ProgressDisplay.Fill"
            :r="size * progress"
            :fill="progressColor"
        />
        <circle
            v-else
            :r="size + 4.5"
            class="progressRing"
            fill="transparent"
            :stroke-dasharray="(size + 4.5) * 2 * Math.PI"
            :stroke-width="5"
            :stroke-dashoffset="(size + 4.5) * 2 * Math.PI - progress * (size + 4.5) * 2 * Math.PI"
            :stroke="progressColor"
        />

        <text :fill="titleColor" class="node-title">{{ title }}</text>
    </g>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { ProgressDisplay } from "@/game/enums";
import player from "@/game/player";
import { BoardNode, NodeType } from "@/typings/features/board";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

// TODO will blindly use any T given (can't restrict it to S[R] because I can't figure out how
//  to make it support narrowing the return type)
function getTypeProperty<T, S extends NodeType, R extends keyof S>(
    nodeType: S,
    node: BoardNode,
    property: R
): S[R] extends Pick<
    S,
    {
        [K in keyof S]-?: undefined extends S[K] ? never : K;
    }[keyof S]
>
    ? T
    : T | undefined {
    return typeof nodeType[property] === "function"
        ? (nodeType[property] as (node: BoardNode) => T)(node)
        : (nodeType[property] as T);
}

export default defineComponent({
    name: "BoardNode",
    mixins: [InjectLayerMixin],
    inject: ["getZoomLevel"],
    data() {
        return {
            ProgressDisplay,
            lastMousePosition: { x: 0, y: 0 },
            dragged: { x: 0, y: 0 },
            dragging: false
        };
    },
    props: {
        index: {
            type: Number,
            required: true
        },
        node: {
            type: Object as PropType<BoardNode>,
            required: true
        },
        nodeType: {
            type: Object as PropType<NodeType>,
            required: true
        }
    },
    computed: {
        draggable(): boolean {
            return getTypeProperty(this.nodeType, this.node, "draggable");
        },
        position(): { x: number; y: number } {
            return this.draggable && this.dragging
                ? {
                      x: this.node.position.x + Math.round(this.dragged.x / 25) * 25,
                      y: this.node.position.y + Math.round(this.dragged.y / 25) * 25
                  }
                : this.node.position;
        },
        size(): number {
            return getTypeProperty(this.nodeType, this.node, "size");
        },
        title(): string {
            return getTypeProperty(this.nodeType, this.node, "title");
        },
        progress(): number {
            return getTypeProperty(this.nodeType, this.node, "progress") || 0;
        },
        backgroundColor(): string {
            return themes[player.theme].variables["--background"];
        },
        outlineColor(): string {
            return (
                getTypeProperty(this.nodeType, this.node, "outlineColor") ||
                themes[player.theme].variables["--separator"]
            );
        },
        fillColor(): string {
            return (
                getTypeProperty(this.nodeType, this.node, "fillColor") ||
                themes[player.theme].variables["--secondary-background"]
            );
        },
        progressColor(): string {
            return getTypeProperty(this.nodeType, this.node, "progressColor") || "none";
        },
        titleColor(): string {
            return (
                getTypeProperty(this.nodeType, this.node, "titleColor") ||
                themes[player.theme].variables["--color"]
            );
        },
        progressDisplay(): ProgressDisplay {
            return (
                getTypeProperty(this.nodeType, this.node, "progressDisplay") ||
                ProgressDisplay.Outline
            );
        }
    },
    methods: {
        mouseDown(e: MouseEvent) {
            if (this.draggable) {
                e.preventDefault();
                e.stopPropagation();

                this.lastMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
                this.dragged = { x: 0, y: 0 };

                this.dragging = true;
                document.onmouseup = this.mouseUp;
                document.onmousemove = this.mouseMove;
            }
        },
        mouseMove(e: MouseEvent) {
            if (this.draggable && this.dragging) {
                e.preventDefault();
                e.stopPropagation();

                const zoom = (this.getZoomLevel as () => number)();
                console.log(zoom);
                this.dragged.x += (e.clientX - this.lastMousePosition.x) / zoom;
                this.dragged.y += (e.clientY - this.lastMousePosition.y) / zoom;
                this.lastMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            }
        },
        mouseUp(e: MouseEvent) {
            if (this.draggable && this.dragging) {
                e.preventDefault();
                e.stopPropagation();

                let node = player.layers[this.nodeType.layer].boards[this.nodeType.id][this.index];
                node.position.x += Math.round(this.dragged.x / 25) * 25;
                node.position.y += Math.round(this.dragged.y / 25) * 25;

                this.dragging = false;
                document.onmouseup = null;
                document.onmousemove = null;
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
