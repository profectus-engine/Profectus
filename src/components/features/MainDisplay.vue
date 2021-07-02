<template>
	<div>
		<span v-if="showPrefix">You have</span>
		<resource :amount="amount" :color="color" />
		{{ resource }}<!-- remove whitespace -->
		<span v-if="effectDisplay">, <component :is="effectDisplay" /></span>
		<br><br>
	</div>
</template>

<script>
import { player } from '../../store/proxies';
import { layers } from '../../store/layers';
import { format, formatWhole } from '../../util/bignum';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'main-display',
	inject: [ 'tab' ],
	props: {
		layer: String,
		precision: Number
	},
	computed: {
		style() {
			return layers[this.layer || this.tab.layer].componentStyles?.['main-display'];
		},
		resource() {
			return layers[this.layer || this.tab.layer].resource;
		},
		effectDisplay() {
			return coerceComponent(layers[this.layer || this.tab.layer].effectDisplay);
		},
		showPrefix() {
			return player[this.layer || this.tab.layer].points.lt('1e1000');
		},
		color() {
			return layers[this.layer || this.tab.layer].color;
		},
		amount() {
			return this.precision == undefined ?
				formatWhole(player[this.layer || this.tab.layer].points) :
				format(player[this.layer || this.tab.layer].points, this.precision);
		}
	}
};
</script>

<style scoped>
</style>
