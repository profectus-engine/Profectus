<template>
	<button @click="press" :class="{ feature: true, can: unlocked, locked: !unlocked }" :style="style">
		<component :is="masterButtonDisplay" />
	</button>
</template>

<script>
import { layers } from '../../game/layers';
import player from '../../game/player';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'master-button',
	inject: [ 'tab' ],
	props: {
		layer: String,
		display: [ String, Object ]
	},
	emits: [ 'press' ],
	computed: {
		style() {
			return [
				layers[this.layer || this.tab.layer].componentStyles?.['master-button']
			];
		},
		unlocked() {
			return player[this.layer || this.tab.layer].unlocked;
		},
		masterButtonDisplay() {
			if (this.display) {
				return coerceComponent(this.display);
			}
			if (layers[this.layer || this.tab.layer].clickables?.masterButtonDisplay) {
				return coerceComponent(layers[this.layer || this.tab.layer].clickables?.masterButtonDisplay);
			}
			return coerceComponent("Click Me!");
		}
	},
	methods: {
		press() {
			this.$emit("press");
		}
	}
};
</script>

<style scoped>
</style>
