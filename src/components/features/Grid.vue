<template>
	<div v-if="grid" class="table">
		<div v-for="row in grid.rows" class="row" :key="row">
			<div v-for="col in grid.cols" :key="col">
				<gridable class="align" :id="id" :cell="row * 100 + col" />
			</div>
		</div>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import './table.css';

export default {
	name: 'grid',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		grid() {
			return layers[this.layer || this.tab.layer].grids[this.id];
		}
	}
};
</script>

<style scoped>
</style>
