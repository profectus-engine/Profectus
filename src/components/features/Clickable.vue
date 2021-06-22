<template>
	<div v-if="clickable.unlocked">
		<button :class="{ feature: true, [layer || tab.layer]: true, can: clickable.canClick, locked: !clickable.canClick }" :style="style"
			@click="clickable.click" @mousedown="start" @mouseleave="stop" @mouseup="stop" @touchstart="start"
			@touchend="stop" @touchcancel="stop" :disabled="!clickable.canClick">
			<div v-if="titleDisplay">
				<component :is="titleDisplay" />
			</div>
			<component :is="descriptionDisplay" style="white-space: pre-line;" />
			<mark-node :mark="clickable.mark" />
			<branch-node :branches="clickable.branches" :id="id" featureType="clickable" />
		</button>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'clickable',
	inject: [ 'tab' ],
	props: {
		id: [ Number, String ],
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
		clickable() {
			return layers[this.layer || this.tab.layer].clickables[this.id];
		},
		style() {
			return [
				this.clickable.canClick ? { 'background-color': layers[this.layer || this.tab.layer].color } : {},
				this.size ? {'height': this.size, 'width': this.size} : {},
				layers[this.layer || this.tab.layer].componentStyles?.clickable,
				this.clickable.style
			];
		},
		titleDisplay() {
			if (this.clickable.titleDisplay) {
				return coerceComponent(this.clickable.titleDisplay, 'h2');
			}
			return null;
		},
		descriptionDisplay() {
			return coerceComponent(this.clickable.descriptionDisplay, 'div');
		}
	},
	methods: {
		start() {
			if (!this.interval) {
				this.interval = setInterval(this.clickable.click, 250);
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
</style>
