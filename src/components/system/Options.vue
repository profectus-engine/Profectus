<template>
	<Modal :show="show" @close="$emit('closeDialog', 'Options')">
		<template v-slot:header>
			<div class="header">
				<h2>Options</h2>
			</div>
		</template>
		<template v-slot:body>
			<Select title="Theme" :options="themes" :value="theme" @change="setTheme" default="classic" />
			<Select title="Show Milestones" :options="msDisplayOptions" :value="msDisplay" @change="setMSDisplay" default="all" />
			<Toggle title="Offline Production" :value="offlineProd" @change="toggleOption('offlineProd')" />
			<Toggle title="Autosave" :value="autosave" @change="toggleOption('autosave')" />
			<Toggle title="Pause game" :value="paused" @change="togglePaused" />
			<Toggle title="Show TPS" :value="showTPS" @change="toggleOption('showTPS')" />
			<Toggle title="Hide Maxed Challenges" :value="hideChallenges" @change="toggleOption('hideChallenges')" />
		</template>
	</Modal>
</template>

<script>
import themes from '../../data/themes';
import { camelToTitle } from '../../util/common';
import { mapState } from '../../util/vue';
import player from '../../game/player';

export default {
	name: 'Options',
	props: {
		show: Boolean
	},
	emits: [ 'closeDialog' ],
	data() {
		return {
			themes: Object.keys(themes).map(theme => ({ label: camelToTitle(theme), value: theme })),
			msDisplayOptions: [ "all", "last", "configurable", "incomplete", "none" ]
				.map(option => ({ label: camelToTitle(option), value: option }))
		}
	},
	computed: {
		...mapState([ "autosave", "offlineProd", "showTPS", "hideChallenges", "theme", "msDisplay" ]),
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
