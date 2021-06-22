<template>
	<button v-if="upgrade.unlocked" :style="style" @click="buy"
		:class="{
			feature: true,
			[tab.layer]: true,
			upgrade: true,
			can: upgrade.canAfford && !upgrade.bought,
			locked: !upgrade.canAfford && !upgrade.bought,
			bought: upgrade.bought
		}" :disabled="!upgrade.canAfford && !upgrade.bought">
		<component v-if="fullDisplay" :is="fullDisplay" />
		<default-upgrade-display v-else :id="id" />
		<branch-node :branches="upgrade.branches" :id="id" featureType="upgrade" />
	</button>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'upgrade',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		upgrade() {
			return layers[this.layer || this.tab.layer].upgrades[this.id];
		},
		style() {
			return [
				this.upgrade.canAfford && !this.upgrade.bought ? { 'background-color': layers[this.layer || this.tab.layer].color } : {},
				layers[this.layer || this.tab.layer].componentStyles?.upgrade,
				this.upgrade.style
			];
		},
		fullDisplay() {
			if (this.upgrade.fullDisplay) {
				return coerceComponent(this.upgrade.fullDisplay, 'div');
			}
			return null;
		}
	},
	methods: {
		buy() {
			this.upgrade.buy();
		}
	}
};
</script>

<style scoped>
.upgrade {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}
</style>
