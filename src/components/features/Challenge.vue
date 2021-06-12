<template>
	<div v-if="shown" :style="style" :class="{ challenge: true, [challengeClass]: true }">
		<div v-if="title"><component :is="title" /></div>
		<button :class="{ [layer || tab.layer]: true, longUpg: true, can: true }" :style="{ backgroundColor: buttonColor }"
			@click="toggle">
			{{ buttonText }}
		</button>
		<component v-if="fullDisplay" :is="fullDisplay" />
		<default-challenge-display v-else :id="id" />
		<mark-node :mark="challenge.mark" />
		<branch-node :branches="challenge.branches" :id="id" featureType="challenge" />
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';
import './features.css';

export default {
	name: 'challenge',
	inject: [ 'tab' ],
	props: {
		layer: String,
		id: [ Number, String ]
	},
	computed: {
		challenge() {
			return layers[this.layer || this.tab.layer].challenges[this.id];
		},
		shown() {
			return this.challenge.unlocked && !(player.hideChallenges && this.challenge.maxes);
		},
		challengeClass() {
			if (this.challenge.canComplete) {
				return "canComplete";
			}
			if (this.challenge.completed) {
				return "done";
			}
			return "locked";
		},
		style() {
			return [
				layers[this.layer || this.tab.layer].componentStyles?.challenge,
				this.challenge.style
			];
		},
		title() {
			if (this.challenge.title) {
				return coerceComponent(this.challenge.titleDisplay, 'h3');
			}
			return null;
		},
		buttonColor() {
			return layers[this.layer || this.tab.layer].color;
		},
		buttonText() {
			if (this.challenge.active) {
				return this.challenge.canComplete ? "Finish" : "Exit Early";
			}
			if (this.challenge.maxed) {
				return "Completed";
			}
			return "Start";
		},
		fullDisplay() {
			if (this.challenge.fullDisplay) {
				return coerceComponent(this.challenge.fullDisplay, 'div');
			}
			return null;
		}
	},
	methods: {
		toggle() {
			this.challenge.toggle();
		}
	}
};
</script>

<style scoped>
.challenge {
    margin: var(--feature-margin);
}
</style>
