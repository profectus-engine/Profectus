<template>
	<fragment>
		<infobox v-if="infobox != undefined" :id="infobox" />
		<main-display />
		<prestige-button v-if="type !== 'none'" />
		<resource-display />
		<milestones />
		<component v-if="midsection" :is="midsection" />
		<clickables />
		<buyables />
		<upgrades />
		<challenges />
		<achievements />
	</fragment>
</template>

<script>
import { layers } from '../../store/layers';

export default {
	name: 'default-layer-tab',
	inject: [ 'layer' ],
	computed: {
		infobox() {
			return layers[this.layer].infoboxes && Object.keys(layers[this.layer].infoboxes)[0];
		},
		type() {
			return layers[this.layer].type;
		},
		midsection() {
			return layers[this.layer].midsection;
		}
	}
};
</script>

<style scoped>
</style>
