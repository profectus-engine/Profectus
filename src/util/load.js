import modInfo from '../data/mod.js';

export function getInitialStore() {
	return {
		tabs: modInfo.initialTabs.slice(),
		time: Date.now(),
		autosave: true,
		offlineProd: true,
		timePlayed: 0,
		keepGoing: false,
		hasNaN: false,
		lastTenTicks: [],
		showTPS: true,
		theme: "paper",
		...modInfo.getStartingData()
	}
}
