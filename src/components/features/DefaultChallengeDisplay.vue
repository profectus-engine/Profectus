<template>
	<div v-frag>
		<component :is="challengeDescription" />
		<div>Goal: <component :is="goalDescription" /></div>
		<div>Reward: <component :is="rewardDescription" /></div>
		<component v-if="rewardDisplay" :is="rewardDisplay" />
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'default-challenge-display',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		challenge() {
			return layers[this.layer || this.tab.layer].challenges[this.id];
		},
		challengeDescription() {
			return coerceComponent(this.challenge.challengeDescription, 'div');
		},
		goalDescription() {
			if (this.challenge.goalDescription) {
				return coerceComponent(this.challenge.goalDescription);
			}
			return coerceComponent(`{{ format(${this.challenge.goal}) }} ${this.currencyDisplayName || 'points'}`);
		},
		rewardDescription() {
			return coerceComponent(this.challenge.rewardDescription);
		},
		rewardDisplay() {
			if (this.challenge.rewardDisplay) {
				return coerceComponent(`Currently: ${this.challenge.rewardDisplay}`);
			}
			return null;
		},
	}
};
</script>

<style scoped>
</style>
