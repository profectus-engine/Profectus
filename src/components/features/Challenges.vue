<template>
	<div v-if="filteredChallenges" class="table">
		<template v-if="filteredChallenges.rows && filteredChallenges.cols">
			<div v-for="row in filteredChallenges.rows" class="row" :key="row">
				<div v-for="col in filteredChallenges.cols" :key="col">
					<challenge v-if="filteredChallenges[row * 10 + col] !== undefined" :id="row * 10 + col" />
				</div>
			</div>
		</template>
		<row v-else>
			<challenge v-for="(challenge, id) in filteredChallenges" :key="id" :id="id" />
		</row>
	</div>
</template>

<script>
import { layers } from '../../game/layers';
import { getFiltered } from '../../util/vue';

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
