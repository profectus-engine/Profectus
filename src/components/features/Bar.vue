<template>
	<div v-if="bar.unlocked" :style="style" class="bar">
		<div class="overlayTextContainer border" :style="borderStyle">
			<component class="overlayText" :style="textStyle" :is="display" />
		</div>
		<div class="border" :style="backgroundStyle">
			<div class="fill" :style="fillStyle" />
		</div>
		<branch-node :branches="bar.branches" :id="id" featureType="bar" />
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { UP, DOWN, LEFT, RIGHT, DEFAULT, coerceComponent } from '../../util/vue';
import Decimal from '../../util/bignum';

export default {
	name: 'bar',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		bar() {
			return layers[this.layer || this.tab.layer].bars[this.id];
		},
		progress() {
			let progress = this.bar.progress instanceof Decimal ? this.bar.progress.toNumber() : this.bar.progress;
			return (1 - Math.min(Math.max(progress, 0), 1)) * 100;
		},
		style() {
			return [
				{ 'width': this.bar.width + "px", 'height': this.bar.height + "px" },
				layers[this.layer || this.tab.layer].componentStyles?.bar,
				this.bar.style
			];
		},
		borderStyle() {
			return [
				{ 'width': this.bar.width + "px", 'height': this.bar.height + "px" },
				this.bar.borderStyle
			];
		},
		textStyle() {
			return [
				this.bar.style,
				this.bar.textStyle
			];
		},
		backgroundStyle() {
			return [
				{ 'width': this.bar.width + "px", 'height': this.bar.height + "px" },
				this.bar.style,
				this.bar.baseStyle,
				this.bar.borderStyle
			];
		},
		fillStyle() {
			const fillStyle = { 'width': (this.bar.width + 0.5) + "px", 'height': (this.bar.height + 0.5) + "px" };
			switch (this.bar.direction) {
				case UP:
					fillStyle['clip-path'] = `inset(${this.progress}% 0% 0% 0%)`;
					fillStyle.width = this.bar.width + 1 + 'px';
					break;
				case DOWN:
					fillStyle['clip-path'] = `inset(0% 0% ${this.progress}% 0%)`;
					fillStyle.width = this.bar.width + 1 + 'px';
					break;
				case RIGHT:
					fillStyle['clip-path'] = `inset(0% ${this.progress}% 0% 0%)`;
					break;
				case LEFT:
					fillStyle['clip-path'] = `inset(0% 0% 0% ${this.progress} + '%)`;
					break;
				case DEFAULT:
					fillStyle['clip-path'] = 'inset(0% 50% 0% 0%)';
					break;
			}
			return [
				fillStyle,
				this.bar.style,
				this.bar.fillStyle
			];
		},
		display() {
			return coerceComponent(this.bar.display);
		}
	}
};
</script>

<style scoped>
.bar {
	position: relative;
	display: table;
}

.overlayTextContainer {
    position: absolute;
    border-radius: 10px;
    vertical-align: middle;
    display: flex;
    justify-content: center;
	z-index: 3;
}

.overlayText {
	z-index: 6;
}

.border {
	border: 2px solid;
    border-radius: 10px;
    border-color: var(--color);
    overflow: hidden;
    -webkit-mask-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA5JREFUeNpiYGBgAAgwAAAEAAGbA+oJAAAAAElFTkSuQmCC);
    margin: 0;
}

.fill {
    position: absolute;
    background-color: var(--color);
    overflow: hidden;
    margin-left: -0.5px;
    transition-duration: 0.2s;
    z-index: 2;
}
</style>
