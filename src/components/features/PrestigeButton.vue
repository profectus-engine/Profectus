<template>
	<button :style="style" @click="resetLayer"
		:class="{ [layer || tab.layer]: true, reset: true, locked: !canReset, can: canReset }" >
		<component v-if="prestigeButtonDisplay" :is="prestigeButtonDisplay" />
		<default-prestige-button-display v-else />
	</button>
</template>

<script>
import { layers } from '../../store/layers';
import { resetLayer } from '../../util/layers';
import { coerceComponent } from '../../util/vue';
import './features.css'

export default {
	name: 'prestige-button',
	inject: [ 'tab' ],
	props: {
		layer: String
	},
	computed: {
		canReset() {
			return layers[this.layer || this.tab.layer].canReset;
		},
		color() {
			return layers[this.layer || this.tab.layer].color;
		},
		prestigeButtonDisplay() {
			if (layers[this.layer || this.tab.layer].prestigeButtonDisplay) {
				return coerceComponent(layers[this.layer || this.tab.layer].prestigeButtonDisplay);
			}
			return null;
		},
		style() {
			return [
				this.canReset ? { 'background-color': this.color } : {},
				layers[this.layer || this.tab.layer].componentStyles?.['prestige-button']
			];
		}
	},
	methods: {
		resetLayer() {
			resetLayer(this.layer || this.tab.layer);
		}
	}
};
</script>

<style scoped>
.reset {
    min-height: 100px;
    width: 180px;
    border-radius: var(--border-radius);
    border: 4px solid rgba(0, 0, 0, 0.125);
    margin: 10px;
}
</style>
