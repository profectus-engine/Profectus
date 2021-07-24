<template>
	<div class="resource-display" :class="{ empty }">
		<div v-if="baseAmount != undefined">You have {{ baseAmount }} {{ baseResource }}</div>
		<div v-if="passiveGeneration != undefined">You are gaining {{ passiveGeneration }} {{ resource }} per second</div>
		<spacer v-if="(baseAmount != undefined || passiveGeneration != undefined) && (best != undefined || total != undefined)" />
		<div v-if="best != undefined">Your best {{ resource }} is {{ best }}</div>
		<div v-if="total != undefined">You have made a total of {{ total }} {{ resource }}</div>
	</div>
</template>

<script>
import { layers } from '../../game/layers';
import player from '../../game/player';
import Decimal, { formatWhole } from '../../util/bignum';

export default {
	name: 'resource-display',
	inject: [ 'tab' ],
	props: {
		layer: String
	},
	computed: {
		baseAmount() {
			return layers[this.layer || this.tab.layer].baseAmount ? formatWhole(layers[this.layer || this.tab.layer].baseAmount) : null;
		},
		baseResource() {
			return layers[this.layer || this.tab.layer].baseResource;
		},
		passiveGeneration() {
			return layers[this.layer || this.tab.layer].passiveGeneration ?
				formatWhole(Decimal.times(layers[this.layer || this.tab.layer].resetGain,
					layers[this.layer || this.tab.layer].passiveGeneration)) :
				null;
		},
		resource() {
			return layers[this.layer || this.tab.layer].resource;
		},
		best() {
			return player[this.layer || this.tab.layer].best ? formatWhole(player[this.layer || this.tab.layer].best) : null;
		},
		total() {
			return player[this.layer || this.tab.layer].total ? formatWhole(player[this.layer || this.tab.layer].total) : null;
		},
		empty() {
			return !(this.baseAmount || this.passiveGeneration || this.best || this.total);
		}
	}
};
</script>

<style scoped>
.resource-display:not(.empty) {
	margin: 10px;
}
</style>