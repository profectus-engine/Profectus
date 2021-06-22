<template>
	<div v-if="filteredAchievements" class="table">
		<div v-frag v-if="filteredAchievements.rows && filteredAchievements.cols">
			<div v-for="row in filteredAchievements.rows" class="row" :key="row">
				<div v-for="col in filteredAchievements.cols" :key="col">
					<achievement v-if="filteredAchievements[row * 10 + col] !== undefined" class="align" :id="row * 10 + col" />
				</div>
			</div>
		</div>
		<div v-frag v-else>
			<achievement v-for="(achievement, id) in filteredAchievements" :key="id" :id="id" />
		</div>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { getFiltered } from '../../util/vue';

export default {
	name: 'achievements',
	inject: [ 'tab' ],
	props: {
		layer: String,
		achievements: Array
	},
	computed: {
		filteredAchievements() {
			return getFiltered(layers[this.layer || this.tab.layer].achievements, this.achievements);
		}
	}
};
</script>

<style scoped>
</style>
