<template>
    <panZoom
        :style="style"
        selector="#g1"
        :options="{ initialZoom: 1, minZoom: 0.1, maxZoom: 10, zoomDoubleClickSpeed: 1 }"
        ref="stage"
        @init="onInit"
        @mousemove="drag"
        @touchmove="drag"
        @mousedown="e => mouseDown(e)"
        @touchstart="e => mouseDown(e)"
        @mouseup="() => endDragging(dragging)"
        @touchend="() => endDragging(dragging)"
        @mouseleave="() => endDragging(dragging)"
    >
        <svg class="stage" width="100%" height="100%">
            <g id="g1">
                <transition-group name="link" appear>
                    <g v-for="link in board.links || []" :key="link">
                        <BoardLink :link="link" />
                    </g>
                </transition-group>
                <transition-group name="grow" :duration="500" appear>
                    <g v-for="node in nodes" :key="node.id" style="transition-duration: 0s">
                        <BoardNode
                            :node="node"
                            :nodeType="board.types[node.type]"
                            :dragging="draggingNode"
                            :dragged="dragged"
                            :hasDragged="hasDragged"
                            :receivingNode="receivingNode?.id === node.id"
                            @mouseDown="mouseDown"
                            @endDragging="endDragging"
                        />
                    </g>
                </transition-group>
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
            dragging: null,
            hasDragged: false
        } as {
            lastMousePosition: { x: number; y: number };
            dragged: { x: number; y: number };
            dragging: number | null;
            hasDragged: boolean;
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
            return this.dragging == null
                ? null
                : this.board.nodes.find(node => node.id === this.dragging);
        },
        nodes() {
            const nodes = this.board.nodes.slice();
            if (this.draggingNode) {
                const draggingNode = nodes.splice(nodes.indexOf(this.draggingNode), 1)[0];
                nodes.push(draggingNode);
            }
            return nodes;
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
                if (curr.id === this.draggingNode!.id) {
                    return smallest;
                }
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
        onInit(panzoomInstance: any) {
            panzoomInstance.setTransformOrigin(null);
        },
        mouseDown(e: MouseEvent | TouchEvent, nodeID: number | null = null, draggable = false) {
            if (this.dragging == null) {
                e.preventDefault();
                e.stopPropagation();

                let clientX, clientY;
                if ("touches" in e) {
                    if (e.touches.length === 1) {
                        clientX = e.touches[0].clientX;
                        clientY = e.touches[0].clientY;
                    } else {
                        return;
                    }
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                this.lastMousePosition = {
                    x: clientX,
                    y: clientY
                };
                this.dragged = { x: 0, y: 0 };
                this.hasDragged = false;

                if (draggable) {
                    this.dragging = nodeID;
                }
            }
            if (nodeID != null) {
                player.layers[this.layer].boards[this.id].selectedNode = null;
                player.layers[this.layer].boards[this.id].selectedAction = null;
            }
        },
        drag(e: MouseEvent | TouchEvent) {
            const zoom = (this.getZoomLevel as () => number)();

            let clientX, clientY;
            if ("touches" in e) {
                if (e.touches.length === 1) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    this.endDragging(this.dragging);
                    return;
                }
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            this.dragged = {
                x: this.dragged.x + (clientX - this.lastMousePosition.x) / zoom,
                y: this.dragged.y + (clientY - this.lastMousePosition.y) / zoom
            };
            this.lastMousePosition = {
                x: clientX,
                y: clientY
            };

            if (Math.abs(this.dragged.x) > 10 || Math.abs(this.dragged.y) > 10) {
                this.hasDragged = true;
            }

            if (this.dragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        endDragging(nodeID: number | null) {
            if (this.dragging != null && this.dragging === nodeID) {
                const draggingNode = this.draggingNode!;
                const receivingNode = this.receivingNode;
                draggingNode.position.x += Math.round(this.dragged.x / 25) * 25;
                draggingNode.position.y += Math.round(this.dragged.y / 25) * 25;

                const nodes = this.board.nodes;
                nodes.splice(nodes.indexOf(draggingNode), 1);
                nodes.push(draggingNode);

                if (receivingNode) {
                    this.board.types[receivingNode.type].onDrop?.(receivingNode, draggingNode);
                }

                this.dragging = null;
            } else if (!this.hasDragged) {
                player.layers[this.layer].boards[this.id].selectedNode = null;
                player.layers[this.layer].boards[this.id].selectedAction = null;
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

.link-enter-from,
.link-leave-to {
    opacity: 0;
}
</style>
