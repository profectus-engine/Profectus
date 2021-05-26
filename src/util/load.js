import modInfo from '../data/modInfo';
import { getStartingData, initialLayers } from '../data/mod';

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
		...getStartingData(),
		...initialLayers.reduce((acc, layer) => {
			acc[layer.name] = layer.startData();
			return acc;
		}, {})
	}
}
