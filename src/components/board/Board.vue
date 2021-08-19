<template>
    <panZoom
        :style="style"
        selector="#g1"
        @init="onInit"
        :options="{ initialZoom: 1, minZoom: 0.1, maxZoom: 10 }"
        ref="stage"
    >
        <svg class="stage" width="100%" height="100%">
            <g id="g1">
                <BoardNode
                    v-for="(node, nodeIndex) in nodes"
                    :key="nodeIndex"
                    :index="nodeIndex"
                    :node="node"
                    :nodeType="board.types[node.type]"
                />
            </g>
        </svg>
    </panZoom>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Board } from "@/typings/features/board";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "Board",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    provide() {
        return {
            getZoomLevel: () => (this.$refs.stage as any).$panZoomInstance.getTransform().scale
        };
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
        nodes() {
            return player.layers[this.layer].boards[this.id];
        }
    },
    methods: {
        onInit: function(panzoomInstance) {
            panzoomInstance.setTransformOrigin(null);
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
