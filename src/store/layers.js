import { isPlainObject } from '../util/common';
import { createProxy, createGridProxy, player } from './proxies';
import Decimal from '../util/bignum';
import store from './index';

// Add layers on second frame so dependencies can resolve
requestAnimationFrame(async () => {
	const { initialLayers } = await import('../data/mod');
	initialLayers.forEach(addLayer);
});

export const layers = {};
export const hotkeys = [];

export function addLayer(layer) {
	// Check for required properties
	if (requiredProperties.some(prop => !(prop in layer))) {
		console.error(`Cannot add layer without a ${requiredProperties.find(prop => !(prop in layer))} property!`, layer);
		return;
	}

	// Set default property values
	layer = Object.assign({}, defaultLayerProperties, layer);
	layer.layer = layer.id;

	const getters = {};

	// Process each feature
	for (let property in gridProperties) {
		if (layer[property]) {
			setRowCol(layer[property]);
		}
	}
	for (let property in featureProperties) {
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
					return !this.deactivated && player[layer.id].upgrades.some(upgrade => upgrade == id);
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
					return !this.deactivated && player[layer.id].achievements.some(achievement => achievement == id);
				}
			}
		}
	}
	if (layer.challenges) {
		if (player[layer.id].challenges == undefined) {
			player[layer.id].challenges = {};
		}
		for (let id in layer.challenges) {
			if (isPlainObject(layer.challenges[id])) {
				layer.challenges[id].completed = function() {
					return !this.deactivated && !!player[layer.id].challenges[id];
				}
				layer.challenges[id].completions = function() {
					return player[layer.id].challenges[id];
				}
				layer.challenges[id].maxed = function() {
					return !this.deactivated && Decimal.gte(player[layer.id].challenges[id], this.completionLimit);
				}
				if (layer.challenges[id].marked == undefined) {
					layer.challenges[id].marked = function() {
						return this.maxed;
					}
				}
				layer.challenges[id].active = function() {
					// TODO search for other rows that "count as" this challenge as well
					return !this.deactivated && (player[layer.id].activeChallenge === id || layers[layer.id].challenges[player[layer.id].activeChallenge]?.countsAs?.includes(id));
				}
			}
		}
	}
	if (layer.buyables) {
		if (player[layer.id].buyables == undefined) {
			player[layer.id].buyables = {};
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
					return !this.deactivated && this.unlocked !== false && this.canAfford !== false && Decimal.lt(player[layer.id].buyables[id], this.purchaseLimit);
				}
				if (layer.buyables[id].purchaseLimit == undefined) {
					layer.buyables[id].purchaseLimit = new Decimal(Infinity);
				}
			}
		}
	}
	if (layer.clickables) {
		if (player[layer.id].clickables == undefined) {
			player[layer.id].clickables = {};
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
				layer.milestones[id].earned = function() {
					return !this.deactivated && player[layer.id].milestones.some(milestone => milestone == id);
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
				layer.grids[id].data = function(cell) {
					return player[layer.id].grids[id][cell];
				}
				layer.grids[id].dataSet = function(cell, data) {
					player[layer.id].grids[id][cell] = data;
				}
				createGridProxy(layer.grids[id], getters, `${layer.id}/grids-${id}-`);
			}
		}
	}
	if (layer.subtabs) {
		layer.activeSubtab = function() {
			if (this.subtabs != undefined) {
				if (player.subtabs[layer.id] in this.subtabs && this.subtabs[player.subtabs[layer.id]].unlocked !== false) {
					return player.subtabs[layer.id];
				}
				return Object.keys(this.subtabs).find(subtab => this.subtabs[subtab].unlocked !== false);
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

const requiredProperties = [ 'id' ];
const defaultLayerProperties = {
	type: "none",
	layerShown: true,
	glowColor: "red"
};
const gridProperties = [ 'upgrades', 'achievements', 'challenges', 'buyables', 'clickables' ];
const featureProperties = [ 'upgrades', 'achievements', 'challenges', 'buyables', 'clickables', 'milestones', 'bars', 'infoboxes', 'grids', 'hotkeys', 'subtabs' ];

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
	for (let id in features) {
		const feature = features[id];
		if (isPlainObject(feature)) {
			feature.id = id;
			feature.layer = layer;
		}
	}
}
