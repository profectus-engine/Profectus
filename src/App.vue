<template>
	<div id="app" @mousemove="updateMouse" :style="theme" :class="{ useHeader }">
		<Nav />
		<Tabs />
		<TPS v-if="showTPS" />
		<GameOverScreen />
		<NaNScreen />
		<portal-target name="modal-root" multiple />
	</div>
</template>

<script>
import Nav from './components/system/Nav';
import Tabs from './components/system/Tabs';
import TPS from './components/system/TPS';
import themes from './data/themes';
import { mapState } from 'vuex';
import { player } from './store/proxies';
import modInfo from './data/modInfo.json';
import './main.css';

export default {
	name: 'App',
	components: {
		Nav, Tabs, TPS
	},
	data() {
		return { useHeader: modInfo.useHeader };
	},
	computed: {
		...mapState([ 'showTPS' ]),
		theme() {
			return themes[player.theme].variables;
		}
	},
	methods: {
		updateMouse(/* event */) {
			// TODO use event to update mouse position for particles
		}
	}
};
</script>

<style scoped>
#app {
	background-color: var(--background);
	color: var(--color);
	display: flex;
	flex-flow: column;
}
</style>
