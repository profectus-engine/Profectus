<template>
	<Modal :show="show" @close="$emit('closeDialog', 'Saves')">
		<div slot="header">
			<h2>Saves Manager</h2>
		</div>
		<div slot="body" v-sortable="{ onUpdate, handle: '.handle' }">
			<save v-for="(save, index) in saves" :key="index" :save="save" @open="openSave(save.id)" @export="exportSave(save.id)"
				@editSave="name => editSave(save.id, name)" @duplicate="duplicateSave(save.id)" @delete="deleteSave(save.id)" />
		</div>
		<div slot="footer" class="modal-footer">
			<TextField :value="saveToImport" @submit="importSave" @input="importSave"
				title="Import Save" placeholder="Paste your save here!" :class="{ importingFailed }" />
			<div class="field">
				<span class="field-title">Create Save</span>
				<div class="field-buttons">
					<button class="button" @click="newSave">New Game</button>
					<Select v-if="Object.keys(bank).length > 0" :value="{ label: 'Select preset' }" :options="bank"
						@change="newFromPreset" />
				</div>
			</div>
			<div class="footer">
				<div style="flex-grow: 1"></div>
				<button class="button modal-default-button" @click="$emit('closeDialog', 'Saves')">
					Close
				</button>
			</div>
		</div>
	</Modal>
</template>

<script>
import Vue from 'vue';
import { newSave, getUniqueID, loadSave, save } from '../../util/save';
import { player } from '../../store/proxies';
import modInfo from '../../data/modInfo.json';

export default {
	name: 'SavesManager',
	props: {
		show: Boolean
	},
	data() {
		let bankContext = require.context('raw-loader!../../../saves', true, /\.txt$/);
		let bank = bankContext.keys().reduce((acc, curr) => {
			// .slice(2, -4) strips the leading ./ and the trailing .txt
			acc.push({ label: curr.slice(2, -4), value: bankContext(curr).default });
			return acc;
		}, []);
		return {
			importingFailed: false,
			saves: {}, // Gets populated when the modal is opened
			saveToImport: "",
			bank
		};
	},
	watch: {
		show(newValue) {
			if (newValue) {
				this.loadSaveData();
			}
		}
	},
	methods: {
		loadSaveData() {
			try {
				const { saves } = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
				this.saves = saves.reduce((acc, curr) => {
					try {
						acc[curr] = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(curr)))));
						acc[curr].id = curr;
					} catch(error) {
						console.warn(`Can't load save with id "${curr}"`, error);
						acc[curr] = { error, id: curr };
					}
					return acc;
				}, {});
			} catch(e) {
				this.saves = { [ player.id ]: player };
				const modData = { active: player.id, saves: [ player.id ] };
				localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
			}
		},
		exportSave(id) {
			let saveToExport;
			if (player.id === id) {
				save();
				saveToExport = player.saveToExport;
			} else {
				saveToExport = btoa(unescape(encodeURIComponent(JSON.stringify(this.saves[id]))));
			}

			// Put on clipboard. Using the clipboard API asks for permissions and stuff
			const el = document.createElement("textarea");
			el.value = saveToExport;
			document.body.appendChild(el);
			el.select();
			el.setSelectionRange(0, 99999);
			document.execCommand("copy");
			document.body.removeChild(el);
		},
		duplicateSave(id) {
			if (player.id === id) {
				save();
			}

			const playerData = { ...this.saves[id], id: getUniqueID() };
			localStorage.setItem(playerData.id, btoa(unescape(encodeURIComponent(JSON.stringify(playerData)))));

			const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
			modData.saves.push(playerData.id);
			localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
			Vue.set(this.saves, playerData.id, playerData);
		},
		deleteSave(id) {
			const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
			modData.saves = modData.saves.filter(save => save !== id);
			localStorage.removeItem(id);
			localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
			Vue.delete(this.saves, id);
		},
		openSave(id) {
			this.saves[player.id].time = player.time;
			loadSave(this.saves[id]);
		},
		async newSave() {
			const playerData = await newSave();
			Vue.set(this.saves, playerData.id, playerData);
		},
		newFromPreset(preset) {
			const playerData = JSON.parse(decodeURIComponent(escape(atob(preset))));
			playerData.id = getUniqueID();
			localStorage.setItem(playerData.id, btoa(unescape(encodeURIComponent(JSON.stringify(playerData)))));

			const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
			modData.saves.push(playerData.id);
			localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
			Vue.set(this.saves, playerData.id, playerData);
		},
		editSave(id, newName) {
			this.saves[id].name = newName;
			if (player.id === id) {
				player.name = newName;
				save();
			} else {
				localStorage.setItem(id, btoa(unescape(encodeURIComponent(JSON.stringify(this.saves[id])))));
			}
		},
		importSave(text) {
			this.saveToImport = text;
			if (text) {
				this.$nextTick(() => {
					try {
						const playerData = JSON.parse(decodeURIComponent(escape(atob(text))));
						const id = getUniqueID();
						playerData.id = id;
						localStorage.setItem(id, btoa(unescape(encodeURIComponent(JSON.stringify(playerData)))));
						Vue.set(this.saves, id, playerData);
						this.saveToImport = "";
						this.importingFailed = false;

						const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
						modData.saves.push(id);
						localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
					} catch (e) {
						this.importingFailed = true;
					}
				});
			} else {
				this.importingFailed = false;
			}
		},
		onUpdate(e) {
			this.saves.splice(e.newIndex, 0, this.saves.splive(e.oldIndex, 1)[0]);

			const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
			modData.saves.splice(e.newIndex, 0, modData.saves.splice(e.oldIndex, 1)[0]);
			localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
		}
	}
};
</script>

<style scoped>
.field form,
.field .field-title,
.field .field-buttons {
	margin: 0;
}

.field-buttons {
	display: flex;
}

.field-buttons .field {
	margin: 0;
	margin-left: 8px;
}

.modal-footer {
    margin-top: -20px;
}

.footer {
	display: flex;
	margin-top: 20px;
}
</style>

<style>
.importingFailed input {
	color: red;
}

.field-buttons .v-select {
	width: 220px;
}
</style>
