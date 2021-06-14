import { isFunction, isPlainObject } from '../util/common';
import { createProxy, createGridProxy, player } from './proxies';
import Decimal from '../util/bignum';
import store from './index';
import { resetLayer, noCache, getStartingBuyables, getStartingClickables, getStartingChallenges } from '../util/layers';

export const layers = {};
export const hotkeys = [];
window.layers = layers;

export function addLayer(layer) {
	// Check for required properties
	if (!('id' in layer)) {
		console.error(`Cannot add layer without a "id" property!`, layer);
		return;
	}
	if (layer.type === "static" || layer.type === "normal") {
		const missingProperty = [ 'baseAmount', 'requires' ].find(prop => !(prop in layer));
		if (missingProperty) {
			console.error(`Cannot add layer without a "${missingProperty}" property!`, layer);
			return;
		}
	}
	if (layer.type === "static" && (layer.base == undefined || Decimal.lte(layer.base, 1))) {
		layer.base = 2;
	}

	// Set default property values
	layer = Object.assign({}, defaultLayerProperties, layer);
	layer.layer = layer.id;
	if (layer.shown == undefined) {
		layer.shown = true;
	}
	if (layer.onClick != undefined) {
		layer.onClick.forceCached = false;
	}
	if (layer.update != undefined) {
		layer.update.forceCached = false;
	}

	const getters = {};

	// Process each feature
	for (let property of gridProperties) {
		if (layer[property]) {
			setRowCol(layer[property]);
		}
	}
	for (let property of featureProperties) {
		if (layer[property]) {
			setupFeature(layer.id, layer[property]);
		}
	}
	if (layer.upgrades) {
		if (player[layer.id].upgrades == undefined) {
			player[layer.id].upgrades = [];
		}
		for (let id in layer.upgrades) {
			if (isPlainObject(layer.upgrades[id])) {
				layer.upgrades[id].bought = function() {
					return !layer.deactivated && player[layer.id].upgrades.some(upgrade => upgrade == id);
				}
				if (layer.upgrades[id].canAfford == undefined) {
					layer.upgrades[id].canAfford = function() {
						if (this.currencyInternalName) {
							let name = this.currencyInternalName;
							if (this.currencyLocation) {
								return !(this.currencyLocation[name].lt(this.cost));
							} else if (this.currencyLayer) {
								let lr = this.currencyLayer;
								return !(player[lr][name].lt(this.cost));
							} else {
								return !(player[name].lt(this.cost));
							}
						} else {
							return !(player[this.layer].points.lt(this.cost))
						}
					}
				}
				if (layer.upgrades[id].pay == undefined) {
					layer.upgrades[id].pay = noCache(function() {
						if (this.bought || !this.canAfford) {
							return;
						}
						if (this.currencyInternalName) {
							let name = this.currencyInternalName
							if (this.currencyLocation) {
								if (this.currencyLocation[name].lt(this.cost)) {
									return;
								}
								this.currencyLocation[name] = this.currencyLocation[name].sub(this.cost);
							} else if (this.currencyLayer) {
								let lr = this.currencyLayer;
								if (player[lr][name].lt(this.cost)) {
									return;
								}
								player[lr][name] = player[lr][name].sub(this.cost);
							} else {
								if (player[name].lt(this.cost)) {
									return;
								}
								player[name] = player[name].sub(this.cost);
							}
						} else {
							if (player[this.layer].points.lt(this.cost)) {
								return;
							}
							player[this.layer].points = player[this.layer].points.sub(this.cost);
						}
					});
				} else {
					layer.upgrades[id].pay.forceCached = false;
				}
				if (layer.upgrades[id].buy == undefined) {
					layer.upgrades[id].buy = noCache(function() {
						if (this.bought || !this.canAfford) {
							return;
						}
						this.pay();
						player[this.layer].upgrades.push(this.id);
						this.onPurchase?.();
					});
				} else {
					layer.upgrades[id].buy.forceCached = false;
				}
			}
		}
	}
	if (layer.achievements) {
		if (player[layer.id].achievements == undefined) {
			player[layer.id].achievements = [];
		}
		for (let id in layer.achievements) {
			if (isPlainObject(layer.achievements[id])) {
				layer.achievements[id].earned = function() {
					return !layer.deactivated && player[layer.id].achievements.some(achievement => achievement == id);
				}
			}
		}
	}
	if (layer.challenges) {
		if (player[layer.id].challenges == undefined) {
			player[layer.id].challenges = getStartingChallenges(layer);
		}
		for (let id in layer.challenges) {
			if (isPlainObject(layer.challenges[id])) {
				layer.challenges[id].completed = function() {
					return !layer.deactivated && !!player[layer.id].challenges[id];
				}
				layer.challenges[id].completions = function() {
					return player[layer.id].challenges[id];
				}
				layer.challenges[id].maxed = function() {
					return !layer.deactivated && Decimal.gte(player[layer.id].challenges[id], this.completionLimit);
				}
				if (layer.challenges[id].mark == undefined) {
					layer.challenges[id].mark = function() {
						return this.maxed;
					}
				}
				layer.challenges[id].active = function() {
					return !layer.deactivated && player[layer.id].activeChallenge === id;
				}
				if (layer.challenges[id].canComplete == undefined) {
					layer.challenges[id].canComplete = function() {
						if (this.active) {
							return false;
						}

						if (this.currencyInternalName) {
							let name = this.currencyInternalName;
							if (this.currencyLocation) {
								return !(this.currencyLocation[name].lt(this.goal));
							} else if (this.currencyLayer) {
								let lr = this.currencyLayer;
								return !(player[lr][name].lt(this.goal));
							} else {
								return !(player[name].lt(this.goal));
							}
						} else {
							return !(player.points.lt(this.goal));
						}
					}
				}
				if (layer.challenges[id].completionLimit == undefined) {
					layer.challenges[id].completionLimit = new Decimal(1);
				}
				layer.challenges[id].toggle = function() {
					let exiting = player[layer.id].activeChallenge === id;
					if (exiting) {
						if (this.canComplete && !this.maxed) {
							let completions = this.canComplete;
							if (completions === true) {
								completions = 1;
							}
							player[layer.id].challenges[id] =
								Decimal.min(player[layer.id].challenges[id].add(completions), this.completionLimit);
							this.onComplete?.();
						}
						player[layer.id].activeChallenge = null;
						this.onExit?.();
						resetLayer(layer.id, true);
					} else if (!exiting && this.canStart) {
						resetLayer(layer.id, true);
						player[layer.id].activeChallenge = id;
						this.onEnter?.();
					}
				}
				if (layer.challenges[id].canStart == undefined) {
					layer.challenges[id].canStart = true;
				}
			}
		}
	}
	if (layer.buyables) {
		if (player[layer.id].buyables == undefined) {
			player[layer.id].buyables = getStartingBuyables(layer);
		}
		if (layer.buyables.reset == undefined) {
			layer.buyables.reset = noCache(function() {
				player[this.layer].buyables = getStartingBuyables(layer);
			});
		}
		for (let id in layer.buyables) {
			if (isPlainObject(layer.buyables[id])) {
				layer.buyables[id].amount = function() {
					return player[layer.id].buyables[id];
				}
				layer.buyables[id].amountSet = function(amount) {
					player[layer.id].buyables[id] = amount;
				}
				layer.buyables[id].canBuy = function() {
					return !layer.deactivated && this.unlocked !== false && this.canAfford !== false &&
						Decimal.lt(player[layer.id].buyables[id], this.purchaseLimit);
				}
				if (layer.buyables[id].purchaseLimit == undefined) {
					layer.buyables[id].purchaseLimit = new Decimal(Infinity);
				}
				if (layer.buyables[id].cost != undefined && layer.buyables[id].buy == undefined) {
					layer.buyables[id].buy = noCache(function() {
						player[this.layer].points = player[this.layer].points.sub(this.cost());
						this.amount = this.amount.add(1);
					});
				} else {
					layer.buyables[id].buy.forceCached = false;
				}
				if (layer.buyables[id].sellOne != undefined) {
					layer.buyables[id].sellOne.forceCached = false;
				}
				if (layer.buyables[id].sellAll != undefined) {
					layer.buyables[id].sellAll.forceCached = false;
				}
			}
		}
	}
	if (layer.clickables) {
		if (player[layer.id].clickables == undefined) {
			player[layer.id].clickables = getStartingClickables(layer);
		}
		for (let id in layer.clickables) {
			if (isPlainObject(layer.clickables[id])) {
				layer.clickables[id].state = function() {
					return player[layer.id].clickables[id];
				}
				layer.clickables[id].stateSet = function(state) {
					player[layer.id].clickables[id] = state;
				}
			}
		}
	}
	if (layer.milestones) {
		if (player[layer.id].milestones == undefined) {
			player[layer.id].milestones = [];
		}
		for (let id in layer.milestones) {
			if (isPlainObject(layer.milestones[id])) {
				layer.milestones[id].shown = function() {
					if (!this.unlocked) {
						return false;
					}

					switch (player.msDisplay) {
						default:
						case "all":
							return true;
						case "last":
							return this.optionsDisplay || !this.earned ||
								player[this.layer].milestones[player[this.layer].milestones.length - 1] === this.id;
						case "configurable":
							return this.optionsDisplay || !this.earned;
						case "incomplete":
							return !this.earned;
						case "none":
							return false;
					}
				}
				layer.milestones[id].earned = function() {
					return !layer.deactivated && player[layer.id].milestones.some(milestone => milestone == id);
				}
			}
		}
	}
	if (layer.grids) {
		if (player[layer.id].grids == undefined) {
			player[layer.id].grids = {};
		}
		for (let id in layer.grids) {
			if (isPlainObject(layer.grids[id])) {
				if (player[layer.id].grids[id] == undefined) {
					player[layer.id].grids[id] = {};
				}
				if (layer.grids[id].getUnlocked == undefined) {
					layer.grids[id].getUnlocked = true;
				}
				if (layer.grids[id].getCanClick == undefined) {
					layer.grids[id].getCanClick = true;
				}
				if (layer.grids[id].getStartData == undefined) {
					layer.grids[id].getStartData = "";
				}
				layer.grids[id].data = function(cell) {
					if (player[layer.id].grids[id][cell] != undefined) {
						return player[layer.id].grids[id][cell];
					}
					if (isFunction(this.getStartData)) {
						return this.getStartData(cell);
					}
					return this.getStartData;
				}
				layer.grids[id].dataSet = function(cell, data) {
					player[layer.id].grids[id][cell] = data;
				}
				layer.grids[id] = createGridProxy(layer.grids[id], getters, `${layer.id}/grids-${id}-`);
			}
		}
	}
	if (layer.subtabs) {
		for (let id in layer.subtabs) {
			if (isPlainObject(layer.subtabs[id])) {
				layer.subtabs[id].active = function() {
					return player.subtabs[this.layer]?.mainTabs === this.id;
				}
			}
		}
		layer.activeSubtab = function() {
			if (this.subtabs != undefined) {
				if (this.subtabs[player.subtabs[layer.id]?.mainTabs] &&
					this.subtabs[player.subtabs[layer.id].mainTabs].unlocked !== false) {
					return this.subtabs[player.subtabs[layer.id].mainTabs];
				}
				// Default to first unlocked tab
				return Object.values(this.subtabs).find(subtab => subtab.unlocked !== false);
			}
		}
	}
	if (layer.microtabs) {
		for (let family in layer.microtabs) {
			for (let id in layer.microtabs[family]) {
				if (isPlainObject(layer.microtabs[family][id])) {
					layer.microtabs[family][id].layer = layer.id;
					layer.microtabs[family][id].family = family;
					layer.microtabs[family][id].id = id;
					layer.microtabs[family][id].active = function() {
						return player.subtabs[this.layer]?.[this.family] === this.id;
					}
				}
			}
			layer.microtabs[family].activeMicrotab = function() {
				if (this[player.subtabs[layer.id][family]]?.unlocked !== false) {
					return this[player.subtabs[layer.id][family]];
				}
				// Default to first unlocked tab
				return Object.values(this).find(microtab => microtab.unlocked !== false);
			}
		}
	}

	// Create layer proxy
	layer = createProxy(layer, getters, `${layer.id}/`);

	// Register layer
	layers[layer.id] = layer;
	store.registerModule(`layer-${layer.id}`, { getters });

	// Register hotkeys
	if (layer.hotkeys) {
		for (let id in layer.hotkeys) {
			hotkeys[id] = layer.hotkeys[id];
		}
	}
}

export function removeLayer(layer) {
	// Un-set hotkeys
	if (layers[layer].hotkeys) {
		for (let id in layers[layer].hotkeys) {
			delete hotkeys[id];
		}
	}

	// Un-register layer
	store.unregisterModule(`layer-${layer}`);
}

export function reloadLayer(layer) {
	removeLayer(layer.id);

	// Re-create layer
	addLayer(layer);
}

export const defaultLayerProperties = {
	type: "none",
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
			let next = this.resetGain.div(this.directMult || 1);
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
		if (player[this.layer].activeChallenge && this.challenges[player[this.layer].activeChallenge].canComplete) {
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
		console.warn("Not yet implemented!", force);
	},
	resetData(keep = []) {
		console.warn("Not yet implemented!", keep);
	}
};
const gridProperties = [ 'upgrades', 'achievements', 'challenges', 'buyables', 'clickables' ];
const featureProperties = [ 'upgrades', 'achievements', 'challenges', 'buyables', 'clickables', 'milestones', 'bars',
	'infoboxes', 'grids', 'hotkeys', 'subtabs' ];

function setRowCol(features) {
	if (features.rows && features.cols) {
		return
	}
	let maxRow = 0;
	let maxCol = 0;
	for (let id in features) {
		if (!isNaN(id)) {
			if (Math.floor(id / 10) > maxRow) {
				maxRow = Math.floor(id / 10);
			}
			if (id % 10 > maxCol) {
				maxCol = id % 10;
			}
		}
	}
	features.rows = maxRow;
	features.cols = maxCol;
}

function setupFeature(layer, features) {
	features.layer = layer;
	for (let id in features) {
		const feature = features[id];
		if (isPlainObject(feature)) {
			feature.id = id;
			feature.layer = layer;
			if (feature.unlocked == undefined) {
				feature.unlocked = true;
			}
		}
	}
}
