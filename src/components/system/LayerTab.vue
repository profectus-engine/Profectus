<template>
	<LayerProvider :layer="layer" :index="index">
		<div class="layer-container">
			<button v-if="index > 0 && allowGoBack && !minimized" class="goBack" @click="goBack(index)">←</button>
			<button class="layer-tab minimized" v-if="minimized" @click="toggleMinimized"><div>{{ name }}</div></button>
			<div class="layer-tab" :style="style" :class="{ hasSubtabs: subtabs }" v-else>
				<branches>
					<sticky v-if="subtabs" class="subtabs-container" :class="{ floating, firstTab: firstTab || !allowGoBack }">
						<div class="subtabs">
							<tab-button v-for="(subtab, id) in subtabs" @selectTab="selectSubtab(id)" :key="id"
								:activeTab="id === activeSubtab" :options="subtab" :text="id" />
						</div>
					</sticky>
					<component v-if="display" :is="display" />
					<default-layer-tab v-else />
				</branches>
			</div>
			<button v-if="minimizable" class="minimize" @click="toggleMinimized">▼</button>
		</div>
	</LayerProvider>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';
import { isPlainObject } from '../../util/common';
import modInfo from '../../data/modInfo.json';
import themes from '../../data/themes';

export default {
	name: 'layer-tab',
	props: {
		layer: String,
		index: Number,
		forceFirstTab: Boolean,
		minimizable: Boolean,
		tab: Function
	},
	data() {
		return { allowGoBack: modInfo.allowGoBack };
	},
	computed: {
		minimized() {
			return this.minimizable && player.minimized[this.layer];
		},
		name() {
			return layers[this.layer].name;
		},
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
	watch: {
		minimized(newValue) {
			if (this.tab == undefined) {
				return;
			}
			const tab = this.tab();
			if (tab != undefined) {
				if (newValue) {
					tab.style.flexGrow = 0;
					tab.style.flexShrink = 0;
					tab.style.width = "60px";
					tab.style.minWidth = null;
					tab.style.margin = 0;
				} else {
					tab.style.flexGrow = null;
					tab.style.flexShrink = null;
					tab.style.width = null;
					tab.style.minWidth = `${layers[this.layer].minWidth}px`;
					tab.style.margin = null;
				}
			}
		}
	},
	mounted() {
		if (this.tab == undefined) {
			return;
		}
		const tab = this.tab();
		if (tab != undefined) {
			if (this.minimized) {
				tab.style.flexGrow = 0;
				tab.style.flexShrink = 0;
				tab.style.width = "60px";
				tab.style.minWidth = null;
				tab.style.margin = 0;
			} else {
				tab.style.flexGrow = null;
				tab.style.flexShrink = null;
				tab.style.width = null;
				tab.style.minWidth = `${layers[this.layer].minWidth}px`;
				tab.style.margin = null;
			}
		} else {
			this.$nextTick(this.mounted);
		}
	},
	methods: {
		selectSubtab(subtab) {
			player.subtabs[this.layer].mainTabs = subtab;
		},
		toggleMinimized() {
			player.minimized[this.layer] = !player.minimized[this.layer];
		},
		goBack(index) {
			player.tabs = player.tabs.slice(0, index);
		}
	}
};
</script>

<style scoped>
.layer-container {
	min-width: 100%;
	min-height: 100%;
	margin: 0;
    flex-grow: 1;
    display: flex;
}

.layer-tab:not(.minimized) {
	padding-top: 20px;
	padding-bottom: 20px;
	min-height: 100%;
    flex-grow: 1;
    text-align: center;
    position: relative;
}

.inner-tab > .layer-container > .layer-tab:not(.minimized) {
	padding-top: 50px;
}

.layer-tab.minimized {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding: 0;
    padding-top: 50px;
    margin: 0;
    cursor: pointer;
    font-size: 40px;
    color: var(--color);
    border: none;
    background-color: transparent;
}

.layer-tab.minimized div {
    margin: 0;
	writing-mode: vertical-rl;
    padding-left: 10px;
    width: 50px;
}

.inner-tab > .layer-container > .layer-tab:not(.minimized) {
	margin: -50px -10px;
	padding: 50px 10px;
}

.layer-tab .subtabs {
	margin-bottom: 24px;
    display: flex;
    flex-flow: wrap;
    padding-right: 60px;
    z-index: 4;
}

.subtabs-container:not(.floating) {
	border-top: solid 4px var(--separator);
	border-bottom: solid 4px var(--separator);
}

.subtabs-container:not(.floating) .subtabs {
	width: calc(100% + 14px);
	margin-left: -7px;
	margin-right: -7px;
	box-sizing: border-box;
	text-align: left;
	padding-left: 14px;
	margin-bottom: -4px;
}

.subtabs-container.floating .subtabs {
	justify-content: center;
	margin-top: -25px;
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

.subtabs-container:not(.floating).firstTab .subtabs {
    padding-left: 0;
    padding-right: 0;
}

.subtabs-container:not(.floating):first-child {
	border-top: 0;
}

.subtabs-container:not(.floating):first-child .subtabs {
	margin-top: -50px;
}

.subtabs-container:not(.floating):not(.firstTab) .subtabs {
	padding-left: 70px;
}

.minimize {
    position: absolute;
    top: 0;
    right: 0;
    background-color: transparent;
    border: 1px solid transparent;
    color: var(--color);
    font-size: 40px;
    cursor: pointer;
    line-height: 40px;
    z-index: 7;
    width: 60px;
    background: var(--background);
}

.minimized + .minimize {
	transform: rotate(-90deg);
    top: 3px;
}

.goBack {
    position: absolute;
    top: 0;
    left: 20px;
    background-color: transparent;
    border: 1px solid transparent;
    color: var(--color);
    font-size: 40px;
    cursor: pointer;
    line-height: 40px;
    z-index: 7;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--color);
}
</style>
