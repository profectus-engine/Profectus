<template>
    <span class="row" v-for="(row, index) in rows" :key="index">
        <tree-node
            v-for="(node, nodeIndex) in row"
            :key="nodeIndex"
            :id="node"
            @show-modal="openModal"
            :append="append"
        />
    </span>
    <span class="side-nodes" v-if="rows.side">
        <tree-node
            v-for="(node, nodeIndex) in rows.side"
            :key="nodeIndex"
            :id="node"
            @show-modal="openModal"
            :append="append"
            small
        />
    </span>
    <modal :show="showModal" @close="closeModal">
        <template v-slot:header
            ><h2 v-if="modalHeader">{{ modalHeader }}</h2></template
        >
        <template v-slot:body
            ><layer-tab v-if="modal" :layer="modal" :index="tab.index" :forceFirstTab="true"
        /></template>
    </modal>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "tree",
    data() {
        return {
            showModal: false,
            modal: null
        } as {
            showModal: boolean;
            modal: string | null;
        };
    },
    props: {
        nodes: Object as PropType<Record<string, Array<string>>>,
        append: Boolean
    },
    inject: ["tab"],
    computed: {
        modalHeader(): string | null {
            if (this.modal == null) {
                return null;
            }
            return layers[this.modal].name || this.modal;
        },
        rows(): Record<string, Array<string>> {
            if (this.nodes != undefined) {
                return this.nodes;
            }
            const rows = Object.keys(layers).reduce((acc: Record<string, Array<string>>, curr) => {
                if (!(layers[curr].displayRow in acc)) {
                    acc[layers[curr].displayRow] = [];
                }
                if (layers[curr].position != undefined) {
                    acc[layers[curr].displayRow][layers[curr].position!] = curr;
                } else {
                    acc[layers[curr].displayRow].push(curr);
                }
                return acc;
            }, {});
            return Object.keys(rows).reduce((acc: Record<string, Array<string>>, curr) => {
                acc[curr] = rows[curr].filter(layer => layer);
                return acc;
            }, {});
        }
    },
    methods: {
        openModal(id: string) {
            this.showModal = true;
            this.modal = id;
        },
        closeModal() {
            this.showModal = false;
        }
    }
});
</script>

<style scoped>
.row {
    margin: 50px auto;
}

.side-nodes {
    position: absolute;
    right: 15px;
    top: 65px;
}
</style>
