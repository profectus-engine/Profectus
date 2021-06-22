<template>
	<button v-if="gridable.unlocked" :class="{ feature: true, tile: true, can: canClick, locked: !canClick}"
		:style="style" @click="gridable.click" @mousedown="start" @mouseleave="stop" @mouseup="stop" @touchstart="start"
		@touchend="stop" @touchcancel="stop" :disabled="!canClick">
		<div v-if="title"><component :is="title" /></div>
		<component :is="display" style="white-space: pre-line;" />
		<branch-node :branches="gridable.branches" :id="id" featureType="gridable" />
	</button>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'gridable',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ],
		cell: [ Number, String ],
		size: {
			type: [ Number, String ]
		}
	},
	data() {
		return {
			interval: false,
			time: 0
		};
	},
	computed: {
		gridable() {
			return layers[this.layer || this.tab.layer].grids[this.id][this.cell];
		},
		canClick() {
			return this.gridable.canClick;
		},
		style() {
			return [
				this.canClick ? { 'background-color': layers[this.layer || this.tab.layer].color } : {},
				layers[this.layer || this.tab.layer].componentStyles?.gridable,
				this.gridable.style
			];
		},
		title() {
			if (this.gridable.title) {
				return coerceComponent(this.gridable.title, 'h3');
			}
			return null;
		},
		display() {
			return coerceComponent(this.gridable.display, 'div');
		}
	},
	methods: {
		start() {
			if (!this.interval) {
				this.interval = setInterval(this.gridable.click, 250);
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
.tile {
	min-height: 80px;
	width: 80px;
	font-size: 10px;
}
</style>
