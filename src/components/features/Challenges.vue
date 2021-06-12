<template>
	<div v-if="filteredChallenges" class="table">
		<div v-frag v-if="filteredChallenges.rows && filteredChallenges.cols">
			<div v-for="row in filteredChallenges.rows" class="row" :key="row">
				<div v-for="col in filteredChallenges.cols" :key="col">
					<challenge v-if="filteredChallenges[row * 10 + col] !== undefined" :id="row * 10 + col" />
				</div>
			</div>
		</div>
		<div v-frag v-else>
			<challenge v-for="(challenge, id) in filteredChallenges" :key="id" :id="id" />
		</div>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { getFiltered } from '../../util/vue';
import './table.css';

export default {
	name: 'challenges',
	inject: [ 'tab' ],
	props: {
		layer: String,
		challenges: Array
	},
	computed: {
		filteredChallenges() {
			return getFiltered(layers[this.layer || this.tab.layer].challenges, this.challenges);
		}
	}
};
</script>

<style scoped>
</style>
