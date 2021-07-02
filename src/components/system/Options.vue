<template>
	<Modal :show="show" @close="$emit('closeDialog', 'Options')">
		<div slot="header" class="header">
			<h2>Options</h2>
		</div>
		<div slot="body">
			<Select title="Theme" :options="themes" :value="theme" @change="setTheme" default="classic" />
			<Select title="Show Milestones" :options="msDisplayOptions" :value="msDisplay" @change="setMSDisplay" default="all" />
			<Toggle title="Offline Production" :value="offlineProd" @change="toggleOption('offlineProd')" />
			<Toggle title="Autosave" :value="autosave" @change="toggleOption('autosave')" />
			<Toggle title="Pause game" :value="paused" @change="togglePaused" />
			<Toggle title="Show TPS" :value="showTPS" @change="toggleOption('showTPS')" />
			<Toggle title="Hide Maxed Challenges" :value="hideChallenges" @change="toggleOption('hideChallenges')" />
		</div>
	</Modal>
</template>

<script>
import themes from '../../data/themes';
import { camelToTitle } from '../../util/common';
import { mapState } from 'vuex';
import { player } from '../../store/proxies';

export default {
	name: 'Options',
	props: {
		show: Boolean
	},
	data() {
		return {
			themes: Object.keys(themes).map(theme => ({ label: camelToTitle(theme), value: theme })),
			msDisplayOptions: [ "all", "last", "configurable", "incomplete", "none" ]
				.map(option => ({ label: camelToTitle(option), value: option }))
		}
	},
	computed: {
		...mapState([ "autosave", "offlineProd", "showTPS", "hideChallenges" ]),
		theme() {
			return { label: camelToTitle(player.theme), value: player.theme };
		},
		msDisplay() {
			return { label: camelToTitle(player.msDisplay), value: player.msDisplay };
		},
		paused() {
			return player.devSpeed === 0;
		}
	},
	methods: {
		toggleOption(option) {
			player[option] = !player[option];
		},
		setTheme(theme) {
			player.theme = theme;
		},
		setMSDisplay(msDisplay) {
			player.msDisplay = msDisplay;
		},
		togglePaused() {
			player.devSpeed = this.paused ? 1 : 0;
		}
	}
};
</script>

<style scoped>
.header {
	margin-bottom: -10px;
}
</style>
