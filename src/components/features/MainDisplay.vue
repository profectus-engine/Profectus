<template>
	<div>
		<span v-if="showPrefix">You have</span>
		<resource :amount="amount" :color="color" />
		{{ resource }}<!-- remove whitespace -->
		<span v-if="effectDescription">, <component :is="effectDescription" /></span>
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
	inject: [ 'layer' ],
	props: {
		precision: Number
	},
	computed: {
		style() {
			return layers[this.layer].componentStyles?.['main-display'];
		},
		resource() {
			return layers[this.layer].resource;
		},
		effectDescription() {
			return coerceComponent(layers[this.layer].effectDescription);
		},
		showPrefix() {
			return player[this.layer].points.lt('1e1000');
		},
		color() {
			return layers[this.layer].color;
		},
		amount() {
			return this.precision == undefined ?
				formatWhole(player[this.layer].points) :
				format(player[this.layer].points, this.precision);
		}
	}
};
</script>

<style scoped>
</style>
