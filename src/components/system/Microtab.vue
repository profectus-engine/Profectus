<template>
	<LayerProvider :layer="layer || tab.layer" :index="tab.index">
		<component :is="display" />
	</LayerProvider>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'microtab',
	inject: [ 'tab' ],
	props: {
		layer: String,
		family: String,
		id: String
	},
	computed: {
		display() {
			const family = layers[this.layer || this.tab.layer].microtabs[this.family];
			return coerceComponent((this.id !== undefined ? family[this.id] : family.activeMicrotab).display);
		}
	}
};
</script>

<style scoped>
</style>
