import modInfo from '../data/modInfo';
import { getStartingData, getInitialLayers, fixOldSave } from '../data/mod';
import player from '../game/player';
import Decimal from './bignum';

export const NOT_IMPORTING = false;
export const IMPORTING = true;
export const IMPORTING_FAILED = "FAILED";
export const IMPORTING_WRONG_ID = "WRONG_ID";
export const IMPORTING_FORCE = "FORCE";

export function getInitialStore(playerData = {}) {
	return applyPlayerData({
		id: `${modInfo.id}-0`,
		name: "Default Save",
		tabs: modInfo.initialTabs.slice(),
		time: Date.now(),
		autosave: true,
		offlineProd: true,
		timePlayed: new Decimal(0),
		keepGoing: false,
		lastTenTicks: [],
		showTPS: true,
		msDisplay: "all",
		hideChallenges: false,
		theme: "paper",
		subtabs: {},
		minimized: {},
		modID: modInfo.id,
		modVersion: modInfo.versionNumber,
		...getStartingData(),

		// Values that don't get loaded/saved
		hasNaN: false,
		NaNPath: [],
		NaNReceiver: null,
		importing: NOT_IMPORTING,
		saveToImport: "",
		saveToExport: ""
	}, playerData);
}

export function save() {
	/* eslint-disable-next-line no-unused-vars */
	let { hasNaN, NaNPath, NaNReceiver, importing, saveToImport, saveToExport, ...playerData } = player.__state;
	player.saveToExport = btoa(unescape(encodeURIComponent(JSON.stringify(playerData))));

	localStorage.setItem(player.id, player.saveToExport);
}

export async function load() {
	try {
		let modData = localStorage.getItem(modInfo.id);
		if (modData == null) {
			await loadSave(newSave());
			return;
		}
		modData = JSON.parse(decodeURIComponent(escape(atob(modData))));
		if (modData?.active == null) {
			await loadSave(newSave());
			return;
		}
		const save = localStorage.getItem(modData.active);
		const playerData = JSON.parse(decodeURIComponent(escape(atob(save))));
		if (playerData.modID !== modInfo.id) {
			await loadSave(newSave());
			return;
		}
		playerData.id = modData.active;
		await loadSave(playerData);
	} catch (e) {
		await loadSave(newSave());
	}
}

export async function newSave() {
	const id = getUniqueID();
	const playerData = getInitialStore({ id });
	localStorage.setItem(id, btoa(unescape(encodeURIComponent(JSON.stringify(playerData)))));

	if (!localStorage.getItem(modInfo.id)) {
		const modData = { active: id, saves: [ id ] };
		localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
	} else {
		const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)))));
		modData.saves.push(id);
		localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
	}

	return playerData;
}

export function getUniqueID() {
	let id, i = 0;
	do {
		id = `${modInfo.id}-${i++}`;
	} while (localStorage.getItem(id));
	return id;
}

export async function loadSave(playerData) {
	const { layers, removeLayer, addLayer } = await import('../game/layers');

	for (let layer in layers) {
		removeLayer(layer);
	}
	getInitialLayers(playerData).forEach(layer => addLayer(layer, playerData));

	playerData = getInitialStore(playerData);
	if (playerData.offlineProd) {
		if (playerData.offTime === undefined)
			playerData.offTime = { remain: 0 };
		playerData.offTime.remain += (Date.now() - playerData.time) / 1000;
	}
	playerData.time = Date.now();
	if (playerData.modVersion !== modInfo.versionNumber) {
		fixOldSave(playerData.modVersion, playerData);
	}

	Object.assign(player, playerData);
	for (let prop in player) {
		if (!(prop in playerData) && !(prop in layers) && prop !== '__state' && prop !== '__path') {
			delete player[prop];
		}
	}
}

export function applyPlayerData(target, source, destructive = false) {
	for (let prop in source) {
		if (target[prop] == null) {
			target[prop] = source[prop];
		} else if (target[prop] instanceof Decimal) {
			target[prop] = new Decimal(source[prop]);
		} else if (Array.isArray(target[prop]) || typeof target[prop] === 'object') {
			target[prop] = applyPlayerData(target[prop], source[prop], destructive);
		} else {
			target[prop] = source[prop];
		}
	}
	if (destructive) {
		for (let prop in target) {
			if (!(prop in source)) {
				delete target[prop];
			}
		}
	}
	return target;
}

setInterval(() => {
	if (player.autosave) {
		save();
	}
}, 1000);
window.onbeforeunload = () => {
	if (player.autosave) {
		save();
	}
};
window.save = save;
