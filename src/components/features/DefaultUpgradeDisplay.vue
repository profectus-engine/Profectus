<template>
	<span>
		<div v-if="title"><component :is="title" /></div>
		<component :is="description" />
		<div v-if="effectDisplay"><br>Currently: <component :is="effectDisplay" /></div>
		<br>
		Cost: {{ cost }} {{ costResource }}
	</span>
</template>

<script>
import { layers } from '../../game/layers';
import { coerceComponent } from '../../util/vue';
import { formatWhole } from '../../util/bignum';

export default {
	name: 'default-upgrade-display',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		upgrade() {
			return layers[this.layer || this.tab.layer].upgrades[this.id];
		},
		title() {
			if (this.upgrade.title) {
				return coerceComponent(this.upgrade.title, 'h3');
			}
			return null;
		},
		description() {
			return coerceComponent(this.upgrade.description, 'div');
		},
		effectDisplay() {
			if (this.upgrade.effectDisplay) {
				return coerceComponent(this.upgrade.effectDisplay);
			}
			return null;
		},
		cost() {
			return formatWhole(this.upgrade.cost);
		},
		costResource() {
			return this.upgrade.currencyDisplayName || layers[this.layer || this.tab.layer].resource;
		}
	}
};
</script>

<style scoped>
</style>
