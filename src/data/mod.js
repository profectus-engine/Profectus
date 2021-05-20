// import TreeTab from '../components/system/TreeTab.vue';
// Import Decimal and numberUtils from a different file to globally change which big num library gets used
import Decimal, * as numberUtils from '../util/break_eternity.js';

export default {
	// General Info
	title: "The Modding Tree X",
	banner: null,
	id: "tmt-x",
	author: "thepaperpilot",
	discordName: "TMT-X Server",
	discordLink: "https://discord.gg/WzejVAx",

	// Gameplay Options
	getStartingData() {
		return {
			points: new Decimal(10),
		}
	},
	// TODO getPointGen or some abstract version?
	hasWon() {
		return false;
	},

	// Version
	versionNumber: "0.0",
	versionTitle: "Initial Commit",

	// UI options
	allowSmall: false,
	useHeader: true,
	//defaultTab: TreeTab

	// Advanced Options
	/* eslint-disable-next-line no-unused-vars */
	fixOldSave(oldVersion) {
	},
	bigNum: { Decimal, ...numberUtils },
	maxTickLength: 3600
};
