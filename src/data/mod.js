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
	shown: true,
	canClick() {return player.points.gte(10)},
	tooltip: "Thanos your points",
	click() {
		player.points = player.points.div(2);
		console.log(this.layer);
	}
};
const h = {
	id: "h",
	branches: ["g", () => ({ target: 'flatBoi', featureType: 'bar', endOffset: { x: -50 + 100 * layers.c.bars.flatBoi.progress.toNumber() } })],
	tooltip() {return "Restore your points to {{ player.c.otherThingy }}"},
	row: "side",
	canClick() {return player.points.lt(player.c.otherThingy)},
	click() {player.points = new Decimal(player.c.otherThingy)}
};
const spook = {
	id: "spook",
	row: 1,
	layerShown: "ghost",
};

const main = {
	id: 'main',
	display: `<div v-frag>
		<div v-if="player.devSpeed && player.devSpeed !== 1">Dev Speed: {{ format(player.devSpeed) }}x</div>
		<div v-if="player.offTime != undefined">Offline Time: {{ formatTime(player.offTime.remain) }}</div>
		<div>
			<span v-if="player.points.lt('1e1000')">You have </span>
			<h2>{{ format(player.points) }}</h2>
			<span v-if="player.points.lt('1e1e6')"> points</span>
		</div>
		<div v-if="Decimal.gt($store.getters.pointGain, 0)">
			({{ player.oompsMag != 0 ? format(player.oomps) + " OOM" + (player.oompsMag < 0 ? "^OOM" : player.oompsMag > 1 ? "^" + player.oompsMag : "") + "s" : formatSmall($store.getters.pointGain) }}/sec)
		</div>
		<spacer />
		<tree :append="true" />
	</div>`,
	name: "Tree"
};

export const getInitialLayers = () => [ main, f, c, a, g, h, spook ];

export function getStartingData() {
	return {
		points: new Decimal(10),
	}
}

export const getters = {
	hasWon() {
		return false;
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
export function fixOldSave(oldVersion, playerData) {
}

document.title = modInfo.title;
