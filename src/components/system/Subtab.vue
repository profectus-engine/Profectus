<template>
	<LayerProvider :layer="layer || tab.layer" :index="tab.index">
		<component :is="display" />
	</LayerProvider>
</template>

<script>
import { layers } from '../../game/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'subtab',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: String
	},
	computed: {
		display() {
			return coerceComponent(layers[this.layer || this.tab.layer].subtabs[this.id].display);
		}
	}
};
</script>

<style scoped>
</style>
