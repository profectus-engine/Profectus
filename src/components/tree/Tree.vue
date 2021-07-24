<template>
	<span class="row" v-for="(row, index) in rows" :key="index">
		<tree-node v-for="(node, nodeIndex) in row" :key="nodeIndex" :id="node" @show-modal="openModal" :append="append" />
	</span>
	<span class="side-nodes" v-if="rows.side">
		<tree-node v-for="(node, nodeIndex) in rows.side" :key="nodeIndex" :id="node" @show-modal="openModal" :append="append" small />
	</span>
	<modal :show="showModal" @close="closeModal">
		<template v-slot:header><h2 v-if="modalHeader">{{ modalHeader }}</h2></template>
		<template v-slot:body><layer-tab v-if="modal" :layer="modal" :index="tab.index" :forceFirstTab="true" /></template>
	</modal>
</template>

<script>
import { layers } from '../../game/layers';

export default {
	name: 'tree',
	data() {
		return {
			showModal: false,
			modal: null
		};
	},
	props: {
		nodes: Array,
		append: Boolean
	},
	inject: [ 'tab' ],
	computed: {
		modalHeader() {
			if (this.modal == null) {
				return null;
			}
			return layers[this.modal].name;
		},
		rows() {
			if (this.nodes != undefined) {
				return this.nodes;
			}
			const rows = Object.keys(layers).reduce((acc, curr) => {
				if (!(layers[curr].displayRow in acc)) {
					acc[layers[curr].displayRow] = [];
				}
				if (layers[curr].position != undefined) {
					acc[layers[curr].displayRow][layers[curr].position] = curr;
				} else {
					acc[layers[curr].displayRow].push(curr);
				}
				return acc;
			}, []);
			return Object.keys(rows).reduce((acc, curr) => {
				acc[curr] = rows[curr].filter(layer => layer);
				return acc;
			}, []);
		}
	},
	methods: {
		openModal(id) {
			this.showModal = true;
			this.modal = id;
		},
		closeModal() {
			this.showModal = false;
		}
	}
};
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
