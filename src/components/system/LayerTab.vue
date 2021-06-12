<template>
	<LayerProvider :layer="layer" :index="index">
		<div class="layer-tab" :style="style" :class="{ hasSubtabs: subtabs }">
			<branches>
				<sticky v-if="subtabs" class="subtabs" :class="{ floating, firstTab }">
					<tab-button v-for="(subtab, id) in subtabs" @selectTab="selectSubtab(id)" :key="id" :activeTab="id === activeSubtab"
						:options="subtab" :text="id" />
				</sticky>
				<component v-if="display" :is="display" />
				<default-layer-tab v-else />
			</branches>
		</div>
	</LayerProvider>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';
import { isPlainObject } from '../../util/common';
import themes from '../../data/themes';

export default {
	name: 'layer-tab',
	props: {
		layer: String,
		index: Number,
		forceFirstTab: Boolean
	},
	computed: {
		floating() {
			return themes[player.theme].floatingTabs;
		},
		style() {
			const style = [];
			if (layers[this.layer].style) {
				style.push(layers[this.layer].style);
			}
			if (layers[this.layer].activeSubtab?.style) {
				style.push(layers[this.layer].activeSubtab.style);
			}
			style.push({ minWidth: `${layers[this.layer].minWidth}px` });
			return style;
		},
		display() {
			if (layers[this.layer].activeSubtab?.display) {
				return coerceComponent(layers[this.layer].activeSubtab.display);
			}
			if (layers[this.layer].display) {
				return coerceComponent(layers[this.layer].display);
			}
			return null;
		},
		subtabs() {
			if (layers[this.layer].subtabs) {
				return Object.entries(layers[this.layer].subtabs)
					.filter(subtab => isPlainObject(subtab[1]) && subtab[1].unlocked !== false)
					.reduce((acc, curr) => {
						acc[curr[0]] = curr[1];
						return acc;
					}, {});
			}
			return null;
		},
		activeSubtab() {
			return layers[this.layer].activeSubtab.id;
		},
		firstTab() {
			if (this.forceFirstTab != undefined) {
				return this.forceFirstTab;
			}
			return this.index === 0;
		}
	},
	methods: {
		selectSubtab(subtab) {
			if (player.subtabs[this.layer] == undefined) {
				player.subtabs[this.layer] = {};
			}
			player.subtabs[this.layer].mainTabs = subtab;
		}
	}
};
</script>

<style scoped>
.layer-tab {
	padding-top: 50px;
	padding-bottom: 20px;
	min-height: 100%;
    flex-grow: 1;
    text-align: center;
    position: relative;
}

.inner-tab > .layer-tab {
	margin: -50px -10px;
	padding: 50px 10px;
}

.layer-tab .subtabs {
	margin-bottom: 24px;
	display: flex;
    z-index: 4;
}

.subtabs:not(.floating) {
	width: calc(100% + 14px);
	border-top: solid 4px var(--separator);
	border-bottom: solid 4px var(--separator);
	height: 50px;
	margin-left: -7px;
	margin-right: -7px;
	box-sizing: border-box;
	text-align: left;
	padding-left: 14px;
}

.modal-body .layer-tab {
	padding-bottom: 0;
}

.modal-body .layer-tab:not(.hasSubtabs) {
	padding-top: 0;
}

.modal-body .subtabs {
	width: 100%;
	margin-left: 0;
	margin-right: 0;
	padding-left: 0;
}

.subtabs:not(.floating):first-child {
	margin-top: -50px;
	border-top: 0;
}

.subtabs:not(.floating):not(.firstTab) {
	padding-left: 70px;
}
</style>
