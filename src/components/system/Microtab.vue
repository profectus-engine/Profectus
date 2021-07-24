<template>
	<div v-if="microtabs" class="microtabs">
		<LayerProvider :layer="layer || tab.layer" :index="tab.index">
			<div v-if="microtabs" class="tabs" :class="{ floating }">
				<tab-button v-for="(microtab, id) in microtabs" @selectTab="selectMicrotab(id)" :key="id"
					:activeTab="id === activeMicrotab.id" :options="microtab" :text="id" />
			</div>
			<layer-tab v-if="embed" :layer="embed" />
			<component v-else :is="display" />
		</LayerProvider>
	</div>
</template>

<script>
import { layers } from '../../game/layers';
import player from '../../game/player';
import { coerceComponent } from '../../util/vue';
import themes from '../../data/themes';

export default {
	name: 'microtab',
	inject: [ 'tab' ],
	props: {
		layer: String,
		family: String,
		id: String
	},
	computed: {
		floating() {
			return themes[player.theme].floatingTabs;
		},
		tabFamily() {
			return layers[this.layer || this.tab.layer].microtabs[this.family];
		},
		microtabs() {
			return Object.keys(this.tabFamily)
				.filter(microtab =>
					microtab !== 'activeMicrotab' && this.tabFamily[microtab].isProxy && this.tabFamily[microtab].unlocked !== false)
				.reduce((acc, curr) => {
					acc[curr] = this.tabFamily[curr];
					return acc;
				}, {});
		},
		activeMicrotab() {
			return this.id != undefined ? this.tabFamily[this.id] : this.tabFamily.activeMicrotab;
		},
		embed() {
			return this.activeMicrotab.embedLayer;
		},
		display() {
			return coerceComponent(this.activeMicrotab.display);
		}
	},
	methods: {
		selectMicrotab(tab) {
			player.subtabs[this.layer || this.tab.layer][this.family] = tab;
		}
	}
};
</script>

<style scoped>
.microtabs {
	margin: var(--feature-margin) -11px;
	position: relative;
	border: solid 4px var(--separator);
}

.tabs:not(.floating) {
	text-align: left;
	border-bottom: inherit;
	border-width: 4px;
	box-sizing: border-box;
	height: 50px;
}
</style>

<style>
.microtabs .sticky {
	margin-left: unset !important;
	margin-right: unset !important;
}
</style>
