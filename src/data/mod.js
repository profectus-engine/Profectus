import { hasMilestone, hasUpgrade, inChallenge, getBuyableAmount } from '../util/features';
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

export function update(delta) {
	let gain = new Decimal(3.19)
	if (hasMilestone("p",0))gain=gain.plus(0.01)
	if (hasMilestone("p",4)){
		if (hasUpgrade("p",12))gain=gain.plus(0.1)
		if (hasUpgrade("p",13))gain=gain.plus(0.1)
		if (hasUpgrade("p",14))gain=gain.plus(0.1)
		if (hasUpgrade("p",21))gain=gain.plus(0.1)
		if (hasUpgrade("p",22))gain=gain.plus(0.1)
		if (hasUpgrade("p",23))gain=gain.plus(0.1)
		if (hasUpgrade("p",31))gain=gain.plus(0.1)
		if (hasUpgrade("p",32))gain=gain.plus(0.1)
		if (hasUpgrade("p",33))gain=gain.plus(0.1)
	}
	if (hasUpgrade("p",11))gain=gain.plus(hasUpgrade("p",34)?(new Decimal(1).plus(layers.p.upgrades[34].effect)):1)
	if (hasUpgrade("p",12))gain=gain.times(hasUpgrade("p",34)?(new Decimal(1).plus(layers.p.upgrades[34].effect)):1)
	if (hasUpgrade("p",13))gain=gain.pow(hasUpgrade("p",34)?(new Decimal(1).plus(layers.p.upgrades[34].effect)):1)
	if (hasUpgrade("p",14))gain=gain.tetrate(hasUpgrade("p",34)?(new Decimal(1).plus(layers.p.upgrades[34].effect)):1)

	if (hasUpgrade("p",71)) gain=gain.plus(1.1)
	if (hasUpgrade("p",72)) gain=gain.times(1.1)
	if (hasUpgrade("p",73)) gain=gain.pow(1.1)
	if (hasUpgrade("p",74)) gain=gain.tetrate(1.1)
	if (hasMilestone("p",5)&&!inChallenge("p",22)){
		let asdf = (hasUpgrade("p",132)?player.p.gp.plus(1).pow(new Decimal(1).div(2)):hasUpgrade("p",101)?player.p.gp.plus(1).pow(new Decimal(1).div(3)):hasUpgrade("p",93)?player.p.gp.plus(1).pow(0.2):player.p.gp.plus(1).log10())
		gain=gain.plus(asdf)
		if (hasUpgrade("p",213))gain=gain.mul(asdf.plus(1))
    }
	if (hasUpgrade("p",104)) gain=gain.times(player.p.points.plus(1).pow(0.5))
	if (hasUpgrade("p",142))gain=gain.times(5)
	if (player.i.unlocked)gain=gain.times(player.i.points.plus(1).pow(hasUpgrade("p",235)?6.9420:1))
	if (inChallenge("p",11)||inChallenge("p",21))gain=new Decimal(10).pow(gain.log10().pow(0.75))
	if (inChallenge("p",12)||inChallenge("p",21))gain=gain.pow(new Decimal(1).sub(new Decimal(1).div(getBuyableAmount("p",11).plus(1))))
	if (hasUpgrade("p",211))gain=gain.times(getBuyableAmount("p",21).plus(1))
	if (hasMilestone("p",13))gain=gain.times(layers.p.buyables[31].effect)
	if (hasMilestone("p",13))gain=gain.pow(layers.p.buyables[42].effect)
	gain.times(delta);
}

export function getStartingData() {
	return {
		points: new Decimal(10),
	}
}

export function hasWon() {
	return false;
}

/* eslint-disable-next-line no-unused-vars */
export function fixOldSave(oldVersion) {
}

document.title = modInfo.title;
