<template>
    <panZoom
        :style="style"
        selector="#g1"
        :options="{ initialZoom: 1, minZoom: 0.1, maxZoom: 10 }"
        ref="stage"
        @init="onInit"
        @mousemove="drag"
        @mouseup="() => endDragging(dragging)"
        @mouseleave="() => endDragging(dragging)"
    >
        <svg class="stage" width="100%" height="100%">
            <g id="g1">
                <BoardNode
                    v-for="node in nodes"
                    :key="node.id"
                    :node="node"
                    :nodeType="board.types[node.type]"
                    :dragging="draggingNode"
                    :dragged="dragged"
                    :receivingNode="receivingNode?.id === node.id"
                    @startDragging="startDragging"
                    @endDragging="endDragging"
                />
                <BoardNode
                    v-if="draggingNode"
                    :node="draggingNode"
                    :nodeType="board.types[draggingNode.type]"
                    :dragging="draggingNode"
                    :dragged="dragged"
                    :receivingNode="receivingNode?.id === draggingNode.id"
                    @startDragging="startDragging"
                    @endDragging="endDragging"
                />
            </g>
        </svg>
    </panZoom>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Board, BoardNode } from "@/typings/features/board";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "Board",
    mixins: [InjectLayerMixin],
    data() {
        return {
            lastMousePosition: { x: 0, y: 0 },
            dragged: { x: 0, y: 0 },
            dragging: null
        } as {
            lastMousePosition: { x: number; y: number };
            dragged: { x: number; y: number };
            dragging: string | null;
        };
    },
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        board(): Board {
            return layers[this.layer].boards!.data[this.id];
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                {
                    width: this.board.width,
                    height: this.board.height
                },
                layers[this.layer].componentStyles?.board,
                this.board.style
            ];
        },
        draggingNode() {
            return this.dragging
                ? player.layers[this.layer].boards[this.id].find(node => node.id === this.dragging)
                : null;
        },
        nodes() {
            return player.layers[this.layer].boards[this.id].filter(
                node => node !== this.draggingNode
            );
        },
        receivingNode(): BoardNode | null {
            if (this.draggingNode == null) {
                return null;
            }

            const position = {
                x: this.draggingNode.position.x + this.dragged.x,
                y: this.draggingNode.position.y + this.dragged.y
            };
            let smallestDistance = Number.MAX_VALUE;
            return this.nodes.reduce((smallest: BoardNode | null, curr: BoardNode) => {
                const nodeType = this.board.types[curr.type];
                const canAccept =
                    typeof nodeType.canAccept === "boolean"
                        ? nodeType.canAccept
                        : nodeType.canAccept(curr, this.draggingNode!);
                if (!canAccept) {
                    return smallest;
                }

                const distanceSquared =
                    Math.pow(position.x - curr.position.x, 2) +
                    Math.pow(position.y - curr.position.y, 2);
                const size =
                    typeof nodeType.size === "number" ? nodeType.size : nodeType.size(curr);
                if (distanceSquared > smallestDistance || distanceSquared > size * size) {
                    return smallest;
                }

                smallestDistance = distanceSquared;
                return curr;
            }, null);
        }
    },
    methods: {
        getZoomLevel(): number {
            return (this.$refs.stage as any).$panZoomInstance.getTransform().scale;
        },
        onInit: function(panzoomInstance) {
            panzoomInstance.setTransformOrigin(null);
        },
        startDragging(e: MouseEvent, nodeID: string) {
            if (this.dragging == null) {
                e.preventDefault();
                e.stopPropagation();

                this.lastMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
                this.dragged = { x: 0, y: 0 };

                this.dragging = nodeID;
            }
        },
        drag(e: MouseEvent) {
            if (this.dragging) {
                e.preventDefault();
                e.stopPropagation();

                const zoom = (this.getZoomLevel as () => number)();
                this.dragged.x += (e.clientX - this.lastMousePosition.x) / zoom;
                this.dragged.y += (e.clientY - this.lastMousePosition.y) / zoom;
                this.lastMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            }
        },
        endDragging(nodeID: string | null) {
            if (this.dragging != null && this.dragging === nodeID) {
                const nodes = player.layers[this.layer].boards[this.id];
                const draggingNode = this.draggingNode!;
                const receivingNode = this.receivingNode;
                draggingNode.position.x += Math.round(this.dragged.x / 25) * 25;
                draggingNode.position.y += Math.round(this.dragged.y / 25) * 25;
                nodes.splice(nodes.indexOf(draggingNode), 1);
                nodes.push(draggingNode);

                if (receivingNode) {
                    this.board.types[receivingNode.type].onDrop(receivingNode, draggingNode);
                }

                this.dragging = null;
            }
        }
    }
});
</script>

<style>
.vue-pan-zoom-scene {
    width: 100%;
    height: 100%;
    cursor: move;
}

#g1 {
    transition-duration: 0s;
}
</style>
