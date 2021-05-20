import modInfo from '../data/mod.js';

export function getInitialStore() {
	return {
		tabs: ["tree-tab", "info-tab", "dummy"],
		time: Date.now(),
		autosave: true,
		offlineProd: true,
		timePlayed: 0,
		keepGoing: false,
		hasNaN: false,
		lastTenTicks: [],
		showTPS: true,
		...modInfo.getStartingData()
	}
}
