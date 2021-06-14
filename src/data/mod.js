import { hasUpgrade, upgradeEffect } from '../util/features';
import { layers } from '../store/layers';
import { player } from '../store/proxies';
import Decimal from '../util/bignum';
import modInfo from './modInfo';

// Import initial layers
import f from './layers/aca/f.js';
import c from './layers/aca/c.js';
import a from './layers/aca/a.js';
const g = {
	id: "g",
	symbol: "TH",
	branches: ["c"],
	color: '#6d3678',
	layerShown: true,
	canClick() {return player.points.gte(10)},
	tooltip: "Thanos your points",
	onClick() {
		player.points = player.points.div(2);
		console.log(this.layer);
	}
};
const h = {
	id: "h",
	branches: ["g", { target: 'flatBoi', featureType: 'bar', endOffset: { x: () => -50 + 100 * layers.c.bars.flatBoi.progress.toNumber() } }],
	layerShown: true,
	tooltip() {return "Restore your points to " + player.c.otherThingy},
	row: "side",
	canClick() {return player.points.lt(player.c.otherThingy)},
	onClick() {player.points = new Decimal(player.c.otherThingy)}
};
const spook = {
	id: "spook",
	row: 1,
	layerShown: "ghost",
};

const main = {
	id: 'main',
	display: '<tree :append="true" />',
	name: "Tree"
}

export const initialLayers = [ main, f, c, a, g, h, spook ];

export function getStartingData() {
	return {
		points: new Decimal(10),
	}
}

export const getters = {
	hasWon() {
		return false
	},
	pointGain() {
		if(!hasUpgrade("c", 11))
			return new Decimal(0);
		let gain = new Decimal(1)
		if (hasUpgrade("c", 12)) gain = gain.times(upgradeEffect("c", 12))
		return gain;
	}
};

/* eslint-disable-next-line no-unused-vars */
export function update(delta) {
}

/* eslint-disable-next-line no-unused-vars */
export function fixOldSave(oldVersion) {
}

document.title = modInfo.title;
