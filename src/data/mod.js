// Import Decimal and numberUtils from a different file to globally change which big num library gets used
import Decimal, * as numberUtils from '../util/break_eternity.js';

const modInfo = {
	// General Info
	title: "The Modding Tree X",
	id: "tmt-x",
	author: "thepaperpilot",
	discordName: "TMT-X",
	discordLink: "https://discord.gg/WzejVAx",

	// Gameplay Options
	getStartingData() {
		return {
			points: new Decimal(10),
		}
	},
	hasWon() {
		return false;
	},
	update(delta) {
		let gain = new Decimal(1);
		// TODO add gain to player.deltas
		gain.times(delta);
	},

	// Version
	versionNumber: "0.0",
	versionTitle: "Initial Commit",

	// UI options
	allowSmall: false,
	defaultDecimalsShown: 2,
	useHeader: false,
	banner: null,
	logo: null,
	initialTabs: ["tree-tab", "info-tab", "dummy"],

	// Advanced Options
	/* eslint-disable-next-line no-unused-vars */
	fixOldSave(oldVersion) {
	},
	bigNum: { Decimal, ...numberUtils },
	maxTickLength: 3600
};

document.title = modInfo.title;

export default modInfo;
