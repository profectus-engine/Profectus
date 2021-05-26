import { isPlainObject } from '../util/common';
import { createProxy, createGridProxy, player } from './proxies';
import Decimal from '../util/bignum';
import store from './index';

// Add layers on second frame so dependencies can resolve
requestAnimationFrame(() => {
	const { initialLayers } = import('../data/mod');
	for (let layer in initialLayers) {
		addLayer(layer);
	}
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

	const getters = {};

	// Process each feature
	for (let property in gridProperties) {
		if (layer[property]) {
			setRowCol(layer[property]);
		}
	}
	for (let property in featureProperties) {
		if (layer[property]) {
			setupFeature(layer.name, layer[property]);
		}
	}
	if (layer.upgrades) {
		for (let id in layer.upgrades) {
			layer.upgrades[id].bought = function() {
				return !this.deactivated && player[layer.name].upgrades.some(upgrade => upgrade == id);
			}
		}
	}
	if (layer.achievements) {
		for (let id in layer.achievements) {
			layer.achievements[id].earned = function() {
				return !this.deactivated && player[layer.name].achievements.some(achievement => achievement == id);
			}
		}
	}
	if (layer.challenges) {
		for (let id in layer.challenges) {
			layer.challenges[id].completed = function() {
				return !this.deactivated && !!player[layer.name].challenges[id];
			}
			layer.challenges[id].completions = function() {
				return player[layer.name].challenges[id];
			}
			layer.challenges[id].maxed = function() {
				return !this.deactivated && Decimal.gte(player[layer.name].challenges[id], this.completionLimit);
			}
			if (layer.challenges[id].marked == undefined) {
				layer.challenges[id].marked = function() {
					return this.maxed;
				}
			}
		}
	}
	if (layer.buyables) {
		for (let id in layer.buyables) {
			layer.buyables[id].amount = function() {
				return player[layer.name].buyables[id];
			}
			layer.buyables[id].amountSet = function(amount) {
				player[layer.name].buyables[id] = amount;
			}
			layer.buyables[id].canBuy = function() {
				return !this.deactivated && this.unlocked !== false && this.canAfford !== false && Decimal.lt(player[layer.name].buyables[id], this.purchaseLimit);
			}
			if (layer.buyables[id].purchaseLimit == undefined) {
				layer.buyables[id].purchaseLimit = new Decimal(Infinity);
			}
		}
	}
	if (layer.clickables) {
		for (let id in layer.clickables) {
			layer.clickables[id].state = function() {
				return player[layer.name].clickables[id];
			}
			layer.clickables[id].stateSet = function(state) {
				player[layer.name].clickables[id] = state;
			}
		}
	}
	if (layer.milestones) {
		for (let id in layer.milestones) {
			layer.milestones[id].earned = function() {
				return !this.deactivated && player[layer.name].milestones.some(milestone => milestone == id);
			}
		}
	}
	if (layer.grids) {
		for (let id in layer.grids) {
			if (layer.grids[id].getUnlocked == undefined) {
				layer.grids[id].getUnlocked = true;
			}
			if (layer.grids[id].getCanClick == undefined) {
				layer.grids[id].getCanClick = true;
			}
			layer.grids[id].data = function(cell) {
				return player[layer.name].grids[id][cell];
			}
			layer.grids[id].dataSet = function(cell, data) {
				player[layer.name].grids[id][cell] = data;
			}
			createGridProxy(layer.name, layer.grids[id], getters, `grids-${id}-`);
		}
	}

	// Create layer proxy
	layer = createProxy(layer.name, layer, getters);

	// Register layer
	layers[layer.name] = layer;
	store.registerModule(layer.name, { getters });

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
	store.unregisterModule(layer);
}

export function reloadLayer(layer) {
	removeLayer(layer.name);

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
const featureProperties = [ 'upgrades', 'achievements', 'challenges', 'buyables', 'clickables', 'milestones', 'bars', 'infoboxes', 'grids', 'hotkeys' ];

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

function setupFeature(getters, layer, featurePrefix, features) {
	for (let id in features) {
		const feature = features[id];
		if (isPlainObject(feature)) {
			feature.id = id;
			feature.layer = layer;
		}
	}
}
