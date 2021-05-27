<template>
	<Modal :show="show" @close="$emit('closeDialog', 'Options')">
		<div slot="header">
			<h2>Options</h2>
		</div>
		<div slot="body">
			<div class="actions">
				<button @click="save">Manually Save</button>
				<button @click="exportSave">Export</button>
				<button @click="importSave" class="danger">Import</button>
				<button @click="hardReset" class="danger">Hard Reset</button>
			</div>
			<Toggle title="Autosave" :value="autosave" @change="toggleOption('autosave')" />
			<Toggle title="Offline Production" :value="offlineProd" @change="toggleOption('offlineProd')" />
			<Toggle title="Show TPS" :value="showTPS" @change="toggleOption('showTPS')" />
			<Select title="Theme" :options="themes" :value="theme" @change="setTheme" default="default" />
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
			themes: Object.keys(themes).map(theme => ({ label: camelToTitle(theme), value: theme }))
		}
	},
	computed: mapState([ "autosave", "offlineProd", "showTPS", "theme" ]),
	methods: {
		toggleOption(option) {
			player[option] = !player[option];
		},
		setTheme(theme) {
			player.theme = theme;
		},
		save() {
			console.warn("Not yet implemented!");
		},
		hardReset() {
			console.warn("Not yet implemented!");
		},
		exportSave() {
			console.warn("Not yet implemented!");
		},
		importSave() {
			console.warn("Not yet implemented!");
		}
	}
};
</script>

<style scoped>
.actions {
	display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
}

.actions * {
	margin: 0;
}

.danger {
	border: solid 2px var(--danger);
	padding-right: 0;
}

.danger::after {
	content:  "!";
	color: white;
	background: var(--danger);
	padding: 2px;
	margin-left: 6px;
	height: 100%;
}
</style>
