<template>
	<LayerProvider :layer="layer" :index="index">
		<div :style="styles">
			<div v-if="subtabs && subtabs.length">
				<button v-for="subtab in subtabs" @click="selectSubtab(subtab)" :key="subtab">{{ subtab }}</button>
			</div>
			<component :is="customComponent" v-if="customComponent" />
			<default-layer-tab v-else />
		</div>
	</LayerProvider>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';

export default {
	name: 'layer-tab',
	props: {
		layer: String,
		index: Number
	},
	computed: {
		styles() {
			const styles = [];
			if (layers[this.layer].style) {
				styles.push(layers[this.layer].style);
			}
			if (layers[this.layer].activeSubtab?.style) {
				styles.push(layers[this.layer].activeSubtab.style);
			}
			return styles;
		},
		customComponent() {
			return this.activeSubtab != undefined ? this.activeSubtab.component : layers[this.layer].component;
		},
		subtabs() {
			if (layers[this.layer].subtabs) {
				return Object.entries(layers[this.layer].subtabs)
					.filter(subtab => subtab[1].unlocked)
					.map(subtab => subtab[0]);
			}
			return null;
		},
		activeSubtab() {
			return player.subtabs[this.layer];
		}
	},
	methods: {
		selectSubtab(subtab) {
			player.subtabs[this.layer] = subtab;
		}
	}
};
</script>

<style scoped>
</style>
