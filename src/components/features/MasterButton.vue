<template>
	<button @click="press" :class="{ longUpg: true, can: unlocked, locked: !unlocked }" :style="style">
		<component :is="masterButtonDisplay" />
	</button>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'master-button',
	inject: [ 'tab' ],
	props: {
		layer: String,
		display: [ String, Object ]
	},
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
