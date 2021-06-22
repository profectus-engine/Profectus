<template>
	<tooltip v-if="achievement.unlocked" :text="tooltip">
		<div :style="style"
			:class="{ [layer || tab.layer]: true, feature: true, achievement: true, locked: !achievement.earned,
				bought: achievement.earned }">
			<component v-if="display" :is="display" />
			<branch-node :branches="achievement.branches" :id="id" featureType="achievement" />
		</div>
	</tooltip>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'achievement',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		achievement() {
			return layers[this.layer || this.tab.layer].achievements[this.id];
		},
		style() {
			return [
				layers[this.layer || this.tab.layer].componentStyles?.achievement,
				this.achievement.style,
				this.achievement.image && this.achievement.earned ? {
					backgroundImage: `url(${this.achievement.image}`
				} : null
			];
		},
		display() {
			if (this.achievement.display) {
				return coerceComponent(this.achievement.display, 'h3');
			}
			return coerceComponent(this.achievement.name, 'h3');
		},
		tooltip() {
			if (this.achievement.earned) {
				return this.achievement.doneTooltip || this.achievement.tooltip || "You did it!";
			}
			return this.achievement.goalTooltip || this.achievement.tooltip || "LOCKED";
		}
	}
};
</script>

<style scoped>
.achievement {
    height: 90px;
    width: 90px;
    font-size: 10px;
    color: white;
    text-shadow: 0 0 2px #000000;
}
</style>
