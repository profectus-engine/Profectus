<template>
	<div v-if="buyable.unlocked" style="display: grid">
		<button :style="style" @click="buyable.buy" @mousedown="start" @mouseleave="stop" @mouseup="stop" @touchstart="start"
			:class="{ feature: true, [layer || tab.layer]: true, buyable: true, can: buyable.canBuy, locked: !buyable.canAfford, bought }"
			@touchend="stop" @touchcancel="stop" :disabled="!buyable.canBuy">
			<div v-if="title">
				<component :is="title" />
			</div>
			<component :is="display" style="white-space: pre-line;" />
			<mark-node :mark="buyable.mark" />
			<branch-node :branches="buyable.branches" :id="id" featureType="buyable" />
		</button>
		<div v-if="(buyable.sellOne !== undefined && buyable.canSellOne !== false) ||
			(buyable.sellAll !== undefined && buyable.canSellAll !== false)" style="width: 100%">
			<button @click="buyable.sellAll" v-if="buyable.sellAll !== undefined && buyable.canSellAll !== false"
				:class="{ 'buyable-button': true, can: buyable.unlocked, locked: !buyable.unlocked, feature: true }"
				:style="{ 'background-color': buyable.canSellAll ? layerColor : '' }">
				Sell All
			</button>
			<button @click="buyable.sellOne" v-if="buyable.sellOne !== undefined && buyable.canSellOne !== false"
				:class="{ 'buyable-button': true, can: buyable.unlocked, locked: !buyable.unlocked, feature: true }"
				:style="{ 'background-color': buyable.canSellOne ? layerColor : '' }">
				Sell One
			</button>
		</div>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'buyable',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ],
		size: [ Number, String ]
	},
	data() {
		return {
			interval: false,
			time: 0
		};
	},
	computed: {
		buyable() {
			return layers[this.layer || this.tab.layer].buyables[this.id];
		},
		bought() {
			return player[this.layer || this.tab.layer].buyables[this.id].gte(this.buyable.purchaseLimit);
		},
		style() {
			return [
				this.buyable.canBuy ? { 'background-color': layers[this.layer || this.tab.layer].color } : {},
				this.size ? { 'height': this.size, 'width': this.size } : {},
				layers[this.layer || this.tab.layer].componentStyles?.buyable,
				this.buyable.style
			];
		},
		title() {
			if (this.buyable.title) {
				return coerceComponent(this.buyable.title, 'h2');
			}
			return null;
		},
		display() {
			return coerceComponent(this.buyable.display, 'div');
		},
		layerColor() {
			return layers[this.layer || this.tab.layer].color;
		}
	},
	methods: {
		start() {
			if (!this.interval) {
				this.interval = setInterval(this.buyable.buy, 250);
			}
		},
		stop() {
			clearInterval(this.interval);
			this.interval = false;
			this.time = 0;
		}
	}
};
</script>

<style scoped>
.buyable {
    height: 200px;
    width: 200px;
}

.buyable-button {
	width: calc(100% - 10px);
}
</style>
