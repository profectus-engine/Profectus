import modInfo from '../data/modInfo';
import { getStartingData, initialLayers } from '../data/mod';
import { getStartingBuyables, getStartingClickables, getStartingChallenges } from './layers';

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
		msDisplay: "all",
		hideChallenges: false,
		theme: "paper",
		subtabs: {},
		minimized: {},
		...getStartingData(),
		...initialLayers.reduce((acc, layer) => {
			acc[layer.id] = {
				upgrades: [],
				achievements: [],
				milestones: [],
				infoboxes: {},
				buyables: getStartingBuyables(layer),
				clickables: getStartingClickables(layer),
				challenges: getStartingChallenges(layer),
				...layer.startData?.()
			};
			return acc;
		}, {})
	}
}
