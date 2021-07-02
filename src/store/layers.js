import Vue from 'vue';
import clone from 'lodash.clonedeep';
import { isFunction, isPlainObject } from '../util/common';
import { createProxy, createGridProxy, player as playerProxy } from './proxies';
import Decimal from '../util/bignum';
import store from './index';
import { noCache, getStartingBuyables, getStartingClickables, getStartingChallenges, defaultLayerProperties } from '../util/layers';
import { applyPlayerData } from '../util/save';

export const layers = {};
export const hotkeys = [];
window.layers = layers;

export function addLayer(layer, player = null) {
	player = player || playerProxy;

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

	// Clone object to prevent modifying the original
	layer = clone(layer);

	player[layer.id] = applyPlayerData({
		upgrades: [],
		achievements: [],
		milestones: [],
		infoboxes: {},
		buyables: getStartingBuyables(layer),
		clickables: getStartingClickables(layer),
		challenges: getStartingChallenges(layer),
		grids: {},
		...layer.startData?.()
	}, player[layer.id]);

	// Set default property values
	layer = Object.assign({}, defaultLayerProperties, layer);
	layer.layer = layer.id;
	if (layer.type === "static" && (layer.base == undefined || Decimal.lte(layer.base, 1))) {
		layer.base = 2;
	}

	const getters = {};

	// Process each feature
	for (let property of uncachedProperties) {
		if (layer[property]) {
			layer[property].forceCached = false;
		}
	}
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
		for (let id in layer.upgrades) {
			if (isPlainObject(layer.upgrades[id])) {
				layer.upgrades[id].bought = function() {
					return !layer.deactivated && playerProxy[layer.id].upgrades.some(upgrade => upgrade == id);
				}
				setDefault(layer.upgrades[id], 'canAfford', function() {
					if (this.currencyInternalName) {
						let name = this.currencyInternalName;
						if (this.currencyLocation) {
							return !(this.currencyLocation[name].lt(this.cost));
						} else if (this.currencyLayer) {
							let lr = this.currencyLayer;
							return !(playerProxy[lr][name].lt(this.cost));
						} else {
							return !(playerProxy[name].lt(this.cost));
						}
					} else {
						return !(playerProxy[this.layer].points.lt(this.cost))
					}
				});
				setDefault(layer.upgrades[id], 'pay', function() {
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
							if (playerProxy[lr][name].lt(this.cost)) {
								return;
							}
							playerProxy[lr][name] = playerProxy[lr][name].sub(this.cost);
						} else {
							if (playerProxy[name].lt(this.cost)) {
								return;
							}
							playerProxy[name] = playerProxy[name].sub(this.cost);
						}
					} else {
						if (playerProxy[this.layer].points.lt(this.cost)) {
							return;
						}
						playerProxy[this.layer].points = playerProxy[this.layer].points.sub(this.cost);
					}
				}, false);
				setDefault(layer.upgrades[id], 'buy', function() {
					if (this.bought || !this.canAfford) {
						return;
					}
					this.pay();
					playerProxy[this.layer].upgrades.push(this.id);
					this.onPurchase?.();
				}, false);
			}
		}
	}
	if (layer.achievements) {
		for (let id in layer.achievements) {
			if (isPlainObject(layer.achievements[id])) {
				layer.achievements[id].earned = function() {
					return !layer.deactivated && playerProxy[layer.id].achievements.some(achievement => achievement == id);
				}
				setDefault(layer.achievements[id], 'onComplete', null, false);
			}
		}
	}
	if (layer.challenges) {
		layer.activeChallenge = function() {
			return Object.values(this.challenges).find(challenge => challenge.active);
		}
		for (let id in layer.challenges) {
			if (isPlainObject(layer.challenges[id])) {
				layer.challenges[id].shown = function() {
					return this.unlocked !== false && (playerProxy.hideChallenges === false || !this.maxed);
				}
				layer.challenges[id].completed = function() {
					return !layer.deactivated && playerProxy[layer.id].challenges[id]?.gt(0);
				}
				layer.challenges[id].completions = function() {
					return playerProxy[layer.id].challenges[id];
				}
				layer.challenges[id].maxed = function() {
					return !layer.deactivated && Decimal.gte(playerProxy[layer.id].challenges[id], this.completionLimit);
				}
				layer.challenges[id].active = function() {
					return !layer.deactivated && playerProxy[layer.id].activeChallenge === id;
				}
				layer.challenges[id].toggle = noCache(function() {
					let exiting = playerProxy[layer.id].activeChallenge === id;
					if (exiting) {
						if (this.canComplete && !this.maxed) {
							let completions = this.canComplete;
							if (completions === true) {
								completions = 1;
							}
							playerProxy[layer.id].challenges[id] =
								Decimal.min(playerProxy[layer.id].challenges[id].add(completions), this.completionLimit);
							this.onComplete?.();
						}
						playerProxy[layer.id].activeChallenge = null;
						this.onExit?.();
						layer.reset(true);
					} else if (!exiting && this.canStart) {
						layer.reset(true);
						playerProxy[layer.id].activeChallenge = id;
						this.onEnter?.();
					}
				});
				setDefault(layer.challenges[id], 'onComplete', null, false);
				setDefault(layer.challenges[id], 'onEnter', null, false);
				setDefault(layer.challenges[id], 'onExit', null, false);
				setDefault(layer.challenges[id], 'canStart', true);
				setDefault(layer.challenges[id], 'completionLimit', new Decimal(1));
				setDefault(layer.challenges[id], 'mark', function() {
					return Decimal.gt(this.completionLimit, 1) && this.maxed;
				});
				setDefault(layer.challenges[id], 'canComplete', function() {
					if (!this.active) {
						return false;
					}
					if (this.currencyInternalName) {
						let name = this.currencyInternalName;
						if (this.currencyLocation) {
							return !(this.currencyLocation[name].lt(this.goal));
						} else if (this.currencyLayer) {
							let lr = this.currencyLayer;
							return !(playerProxy[lr][name].lt(this.goal));
						} else {
							return !(playerProxy[name].lt(this.goal));
						}
					} else {
						return !(playerProxy.points.lt(this.goal));
					}
				});
			}
		}
	}
	if (layer.buyables) {
		setDefault(layer.buyables, 'respec', null, false);
		setDefault(layer.buyables, 'reset', function() {
			playerProxy[this.layer].buyables = getStartingBuyables(layer);
		}, false);
		for (let id in layer.buyables) {
			if (isPlainObject(layer.buyables[id])) {
				layer.buyables[id].amount = function() {
					return playerProxy[layer.id].buyables[id];
				}
				layer.buyables[id].amountSet = function(amount) {
					playerProxy[layer.id].buyables[id] = amount;
				}
				layer.buyables[id].canBuy = function() {
					return !layer.deactivated && this.unlocked !== false && this.canAfford !== false &&
						Decimal.lt(playerProxy[layer.id].buyables[id], this.purchaseLimit);
				}
				setDefault(layer.buyables[id], 'purchaseLimit', new Decimal(Infinity));
				setDefault(layer.buyables[id], 'sellOne', null, false);
				setDefault(layer.buyables[id], 'sellAll', null, false);
				if (layer.buyables[id].cost != undefined) {
					setDefault(layer.buyables[id], 'buy', function() {
						if (this.canBuy) {
							playerProxy[this.layer].points = playerProxy[this.layer].points.sub(this.cost());
							this.amount = this.amount.add(1);
						}
					}, false);
				}
			}
		}
	}
	if (layer.clickables) {
		layer.clickables.layer = layer.id;
		setDefault(layer.clickables, 'masterButtonClick', null, false);
		if (layer.clickables.masterButtonDisplay != undefined) {
			setDefault(layer.clickables, 'showMaster', true);
		}
		for (let id in layer.clickables) {
			if (isPlainObject(layer.clickables[id])) {
				layer.clickables[id].state = function() {
					return playerProxy[layer.id].clickables[id];
				}
				layer.clickables[id].stateSet = function(state) {
					playerProxy[layer.id].clickables[id] = state;
				}
				setDefault(layer.clickables[id], 'click', null, false);
				setDefault(layer.clickables[id], 'hold', null, false);
			}
		}
	}
	if (layer.milestones) {
		for (let id in layer.milestones) {
			if (isPlainObject(layer.milestones[id])) {
				layer.milestones[id].earned = function() {
					return !layer.deactivated && playerProxy[layer.id].milestones.some(milestone => milestone == id);
				}
				layer.milestones[id].shown = function() {
					if (!this.unlocked) {
						return false;
					}
					switch (playerProxy.msDisplay) {
						default:
						case "all":
							return true;
						case "last":
							return this.optionsDisplay || !this.earned ||
								playerProxy[this.layer].milestones[playerProxy[this.layer].milestones.length - 1] === this.id;
						case "configurable":
							return this.optionsDisplay || !this.earned;
						case "incomplete":
							return !this.earned;
						case "none":
							return false;
					}
				}
			}
		}
	}
	if (layer.grids) {
		for (let id in layer.grids) {
			if (isPlainObject(layer.grids[id])) {
				setDefault(player[layer.id].grids, id, {});
				layer.grids[id].getData = function(cell) {
					if (playerProxy[layer.id].grids[id][cell] != undefined) {
						return playerProxy[layer.id].grids[id][cell];
					}
					if (isFunction(this.getStartData)) {
						return this.getStartData(cell);
					}
					return this.getStartData;
				}
				layer.grids[id].dataSet = function(cell, data) {
					playerProxy[layer.id].grids[id][cell] = data;
				}
				setDefault(layer.grids[id], 'getUnlocked', true, false);
				setDefault(layer.grids[id], 'getCanClick', true, false);
				setDefault(layer.grids[id], 'getStartData', "", false);
				setDefault(layer.grids[id], 'getStyle', null, false);
				setDefault(layer.grids[id], 'click', null, false);
				setDefault(layer.grids[id], 'hold', null, false);
				setDefault(layer.grids[id], 'getTitle', null, false);
				setDefault(layer.grids[id], 'getDisplay', null, false);
				layer.grids[id] = createGridProxy(layer.grids[id], getters, `${layer.id}/grids-${id}-`);
			}
		}
	}
	if (layer.subtabs) {
		layer.activeSubtab = function() {
			if (this.subtabs != undefined) {
				if (this.subtabs[player.subtabs[layer.id].mainTabs] &&
					this.subtabs[player.subtabs[layer.id].mainTabs].unlocked !== false) {
					return this.subtabs[player.subtabs[layer.id].mainTabs];
				}
				// Default to first unlocked tab
				return Object.values(this.subtabs).find(subtab => subtab.unlocked !== false);
			}
		}
		setDefault(player.subtabs, layer.id, {});
		setDefault(player.subtabs[layer.id], 'mainTabs', Object.keys(layer.subtabs)[0]);
		for (let id in layer.subtabs) {
			if (isPlainObject(layer.subtabs[id])) {
				layer.subtabs[id].active = function() {
					return playerProxy.subtabs[this.layer].mainTabs === this.id;
				}
			}
		}
	}
	if (layer.microtabs) {
		setDefault(player.subtabs, layer.id, {});
		for (let family in layer.microtabs) {
			layer.microtabs[family].activeMicrotab = function() {
				if (this[player.subtabs[this.layer]?.[family]] && this[player.subtabs[this.layer][family]].unlocked !== false) {
					return this[player.subtabs[this.layer][family]];
				}
				// Default to first unlocked tab
				return this[Object.keys(this).find(microtab => microtab !== 'activeMicrotab' && this[microtab].unlocked !== false)];
			}
			setDefault(player.subtabs[layer.id], family, Object.keys(layer.microtabs[family])[0]);
			layer.microtabs[family].layer = layer.id;
			layer.microtabs[family].family = family;
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
		}
	}
	if (layer.hotkeys) {
		for (let id in layer.hotkeys) {
			if (isPlainObject(layer.hotkeys[id])) {
				setDefault(layer.hotkeys[id], 'press', null, false);
				setDefault(layer.hotkeys[id], 'unlocked', function() {
					return layer.unlocked;
				});
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
			hotkeys[layer.hotkeys[id].key] = layer.hotkeys[id];
		}
	}
}

export function removeLayer(layer) {
	// Un-set hotkeys
	if (layers[layer].hotkeys) {
		for (let id in layers[layer].hotkeys) {
			Vue.delete(hotkeys, id);
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

const uncachedProperties = [ 'startData', 'click', 'update', 'reset', 'hardReset' ];
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

function setDefault(object, key, value, forceCached) {
	if (object[key] == undefined && value != undefined) {
		object[key] = value;
	}
	if (object[key] != undefined && isFunction(object[key]) && forceCached != undefined) {
		object[key].forceCached = forceCached;
	}
}
