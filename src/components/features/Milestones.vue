<template>
	<div v-if="filteredMilestones" class="table">
		<milestone v-for="(milestone, id) in filteredMilestones" :key="id" :id="id" />
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { getFiltered } from '../../util/vue';
import './table.css';

export default {
	name: 'milestones',
	inject: [ 'tab' ],
	props: {
		layer: String,
		milestones: Array
	},
	computed: {
		filteredMilestones() {
			return getFiltered(layers[this.layer || this.tab.layer].milestones, this.milestones);
		}
	}
};
</script>

<style scoped>
</style>
