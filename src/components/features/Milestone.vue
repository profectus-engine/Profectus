<template>
	<div v-if="milestone.shown" :style="style" :class="{ feature: true,  milestone: true, done: milestone.earned }">
		<div v-if="requirementDisplay"><component :is="requirementDisplay" /></div>
		<div v-if="effectDisplay"><component :is="effectDisplay" /></div>
		<component v-if="optionsDisplay" :is="optionsDisplay" />
		<branch-node :branches="milestone.branches" :id="id" featureType="milestone" />
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';
import './features.css';

export default {
	name: 'milestone',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		milestone() {
			return layers[this.layer || this.tab.layer].milestones[this.id];
		},
		style() {
			return [
				layers[this.layer || this.tab.layer].componentStyles?.milestone,
				this.milestone.style
			];
		},
		requirementDisplay() {
			if (this.milestone.requirementDisplay) {
				return coerceComponent(this.milestone.requirementDisplay, 'h3');
			}
			return null;
		},
		effectDisplay() {
			if (this.milestone.effectDisplay) {
				return coerceComponent(this.milestone.effectDisplay, 'b');
			}
			return null;
		},
		optionsDisplay() {
			if (this.milestone.optionsDisplay && this.milestone.earned) {
				return coerceComponent(this.milestone.optionsDisplay, 'div');
			}
			return null;
		}
	}
};
</script>

<style scoped>
.milestone {
    width: calc(100% - 10px);
    min-width: 120px;
    padding-left: 5px;
    padding-right: 5px;
    min-height: 75px;
    background-color: var(--locked);
    border-width: 4px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.5);
    margin: 0;
}

.milestone.done {
    background-color: var(--bought);
    cursor: default;
}
</style>
