<template>
	<div v-if="filteredUpgrades" class="table">
		<template v-if="filteredUpgrades.rows && filteredUpgrades.cols">
			<div v-for="row in filteredUpgrades.rows" class="row" :key="row">
				<div v-for="col in filteredUpgrades.cols" :key="col">
					<upgrade v-if="filteredUpgrades[row * 10 + col] !== undefined" class="align" :id="row * 10 + col" />
				</div>
			</div>
		</template>
		<row v-else>
			<upgrade v-for="(upgrade, id) in filteredUpgrades" :key="id" class="align" :id="id" />
		</row>
	</div>
</template>

<script>
import { layers } from '../../game/layers';
import { getFiltered } from '../../util/vue';

export default {
	name: 'upgrades',
	inject: [ 'tab' ],
	props: {
		layer: String,
		upgrades: Array
	},
	computed: {
		filteredUpgrades() {
			return getFiltered(layers[this.layer || this.tab.layer].upgrades, this.upgrades);
		}
	}
};
</script>

<style scoped>
</style>
