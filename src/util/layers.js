import Decimal from './bignum';
import { isPlainObject } from './common';
import { layers, hotkeys } from '../store/layers';
import { player } from '../store/proxies';

export function resetLayer(layer, force = false) {
	layers[layer].reset(force);
}

export function hardReset(layer, keep = []) {
	layers[layer].hardReset(keep);
}

export function cache(func) {
	func.forceCached = true;
	return func;
}

export function noCache(func) {
	func.forceCached = false;
	return func;
}

export function getStartingBuyables(layer) {
	return layer.buyables && Object.keys(layer.buyables).reduce((acc, curr) => {
		if (isPlainObject(layer.buyables[curr])) {
			acc[curr] = new Decimal(0);
		}
		return acc;
	}, {});
}

export function getStartingClickables(layer) {
	return layer.clickables && Object.keys(layer.clickables).reduce((acc, curr) => {
		if (isPlainObject(layer.clickables[curr])) {
			acc[curr] = "";
		}
		return acc;
	}, {});
}

export function getStartingChallenges(layer) {
	return layer.challenges && Object.keys(layer.challenges).reduce((acc, curr) => {
		if (isPlainObject(layer.challenges[curr])) {
			acc[curr] = new Decimal(0);
		}
		return acc;
	}, {});
}

export function resetLayerData(layer, keep = []) {
	keep.push('unlocked', 'forceTooltip', 'noRespecConfirm');
	const keptData = keep.reduce((acc, curr) => {
		acc[curr] = player[layer][curr];
		return acc;
	}, {});

	player.upgrades = [];
	player.achievements = [];
	player.milestones = [];
	player.infoboxes = {};

	player[layer].buyables = getStartingBuyables(layers[layer]);
	player[layer].clickables = getStartingClickables(layers[layer]);
	player[layer].challenges = getStartingChallenges(layers[layer]);

	Object.assign(player[layer], layers[layer].startData?.());

	for (let item in keptData) {
		player[layer][item] = keptData[item];
	}
}

export function resetRow(row, ignore) {
	console.log(row, ignore);
	Object.values(layers).filter(layer => layer.row === row && layer.layer !== ignore).forEach(layer => layer.hardReset());
}

export const defaultLayerProperties = {
	type: "none",
	shown: true,
	layerShown: true,
	glowColor: "red",
	minWidth: 640,
	displayRow() {
		return this.row;
	},
	symbol() {
		return this.id;
	},
	unlocked() {
		if (player[this.id].unlocked) {
			return true;
		}
		if (this.type !== "none" && this.canReset && this.layerShown) {
			return true;
		}
		return false;
	},
	trueGlowColor() {
		if (this.subtabs) {
			for (let subtab of Object.values(this.subtabs)) {
				if (subtab.notify) {
					return subtab.glowColor || "red";
				}
			}
		}
		if (this.microtabs) {
			for (let microtab of Object.values(this.microtabs)) {
				if (microtab.notify) {
					return microtab.glowColor || "red";
				}
			}
		}
		return this.glowColor || "red";
	},
	resetGain() {
		if (this.type === "none" || this.type === "custom") {
			return new Decimal(0);
		}
		if (this.gainExp?.eq(0)) {
			return new Decimal(0);
		}
		if (this.baseAmount.lt(this.requires)) {
			return new Decimal(0);
		}
		if (this.type === "static") {
			if (!this.canBuyMax) {
				return new Decimal(1);
			}
			let gain = this.baseAmount.div(this.requires).div(this.gainMult || 1).max(1).log(this.base)
				.times(this.gainExp || 1).pow(Decimal.pow(this.exponent || 1, -1));
			gain = gain.times(this.directMult || 1);
			return gain.floor().sub(player[this.layer].points).add(1).max(1);
		}
		if (this.type === "normal") {
			let gain = this.baseAmount.div(this.requires).pow(this.exponent || 1).times(this.gainMult || 1)
				.pow(this.gainExp || 1);
			if (this.softcap && gain.gte(this.softcap)) {
				gain = gain.pow(this.softcapPower).times(this.softcap.pow(Decimal.sub(1, this.softcapPower)));
			}
			gain = gain.times(this.directMult || 1);
			return gain.floor().max(0);
		}
		// Unknown prestige type
		return new Decimal(0);
	},
	nextAt() {
		if (this.type === "none" || this.type === "custom") {
			return new Decimal(Infinity);
		}
		if (this.gainMult?.lte(0) || this.gainExp?.lte(0)) {
			return new Decimal(Infinity);
		}
		if (this.type === "static") {
			const amount = player[this.layer].points.div(this.directMult || 1);
			const extraCost = Decimal.pow(this.base, amount.pow(this.exponent || 1).div(this.gainExp || 1))
				.times(this.gainMult || 1);
			let cost = extraCost.times(this.requires).max(this.requires);
			if (this.roundUpCost) {
				cost = cost.ceil();
			}
			return cost;
		}
		if (this.type === "normal") {
			let next = this.resetGain.add(1).div(this.directMult || 1);
			if (this.softcap && next.gte(this.softcap)) {
				next = next.div(this.softcap.pow(Decimal.sub(1, this.softcapPower)))
					.pow(Decimal.div(1, this.softcapPower));
			}
			next = next.root(this.gainExp || 1).div(this.gainMult || 1).root(this.exponent || 1)
				.times(this.requires).max(this.requires);
			if (this.roundUpCost) {
				next = next.ceil();
			}
			return next;
		}
		// Unknown prestige type
		return new Decimal(0);
	},
	nextAtMax() {
		if (!this.canBuyMax || this.type !== "static") {
			return this.nextAt;
		}
		const amount = player[this.layer].points.plus(this.resetGain).div(this.directMult || 1);
		const extraCost = Decimal.pow(this.base, amount.pow(this.exponent || 1).div(this.gainExp || 1))
			.times(this.gainMult || 1);
		let cost = extraCost.times(this.requires).max(this.requires);
		if (this.roundUpCost) {
			cost = cost.ceil();
		}
		return cost;
	},
	canReset() {
		if (this.type === "normal") {
			return this.baseAmount.gte(this.requires);
		}
		if (this.type === "static") {
			return this.baseAmount.gte(this.nextAt);
		}
		return false;
	},
	notify() {
		if (this.upgrades) {
			if (Object.values(this.upgrades).some(upgrade => upgrade.canAfford && !upgrade.bought && upgrade.unlocked)) {
				return true;
			}
		}
		if (this.activeChallenge?.canComplete) {
			return true;
		}
		if (this.subtabs) {
			if (Object.values(this.subtabs).some(subtab => subtab.notify)) {
				return true;
			}
		}
		if (this.microtabs) {
			if (Object.values(this.microtabs).some(subtab => subtab.notify)) {
				return true;
			}
		}

		return false;
	},
	resetNotify() {
		if (this.subtabs) {
			if (Object.values(this.subtabs).some(subtab => subtab.prestigeNotify)) {
				return true;
			}
		}
		if (this.microtabs) {
			if (Object.values(this.microtabs).some(microtab => microtab.prestigeNotify)) {
				return true;
			}
		}
		if (this.autoPrestige || this.passiveGeneration) {
			return false;
		}
		if (this.type === "static") {
			return this.canReset;
		}
		if (this.type === "normal") {
			return this.canReset && this.resetGain.gte(player[this.layer].points.div(10));
		}
		return false;
	},
	reset(force = false) {
		if (this.type === 'none') {
			return;
		}
		if (!force) {
			if (!this.canReset) {
				return;
			}
			this.onPrestige?.(this.resetGain);
			if (player[this.layer].points != undefined) {
				player[this.layer].points = player[this.layer].points.add(this.resetGain);
			}
			if (!player[this.layer].unlocked) {
				player[this.layer].unlocked = true;
				if (this.increaseUnlockOrder) {
					for (let layer in this.increaseUnlockOrder) {
						player[layer].unlockOrder = (player[layer].unlockOrder || 0) + 1;
					}
				}
			}
		}

		if (this.resetsNothing) {
			return;
		}

		Object.values(layers).forEach(layer => {
			if (this.row >= layer.row && (!force || this !== layer)) {
				this.activeChallenge?.toggle();
			}
		});

		player.points = new Decimal(0);

		for (let row = this.row - 1; row >= 0; row--) {
			resetRow(row, this.layer);
		}
		resetRow('side', this.layer);

		if (player[this.layer].resetTime != undefined) {
			player[this.layer].resetTime = 0;
		}
	},
	hardReset(keep = []) {
		if (!isNaN(this.row)) {
			resetLayerData(this.layer, keep);
		}
	}
};

document.onkeydown = function(e) {
	if (player.hasWon && !player.keepGoing) {
		return;
	}
	let key = e.key;
	if (e.shiftKey) {
		key = "shift+" + key;
	}
	if (e.ctrlKey) {
		key = "ctrl+" + key;
	}
	if (hotkeys[key]) {
		e.preventDefault();
		if (hotkeys[key].unlocked) {
			hotkeys[key].press?.();
		}
	}
}
