<template>
	<div v-frag>
		<infobox v-if="infobox != undefined" :id="infobox" />
		<main-display />
		<sticky v-if="showPrestigeButton"><prestige-button /></sticky>
		<resource-display />
		<milestones />
		<component v-if="midsection" :is="midsection" />
		<clickables />
		<buyables />
		<upgrades />
		<challenges />
		<achievements />
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'default-layer-tab',
	inject: [ 'tab' ],
	props: {
		layer: String
	},
	computed: {
		infobox() {
			return layers[this.layer || this.tab.layer].infoboxes && Object.keys(layers[this.layer || this.tab.layer].infoboxes)[0];
		},
		midsection() {
			if (layers[this.layer || this.tab.layer].midsection) {
				return coerceComponent(layers[this.layer || this.tab.layer].midsection);
			}
			return null;
		},
		showPrestigeButton() {
			return layers[this.layer || this.tab.layer].type !== "none";
		},
	}
};
</script>

<style scoped>
</style>
