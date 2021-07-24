import { layers } from '../game/layers';

export function hasUpgrade(layer, id) {
	return layers[layer]?.upgrades?.[id]?.bought;
}

export function hasMilestone(layer, id) {
	return layers[layer]?.milestones?.[id]?.earned;
}

export function hasAchievement(layer, id) {
	return layers[layer]?.achievements?.[id]?.earned;
}

export function hasChallenge(layer, id) {
	return layers[layer]?.challenges?.[id]?.completed;
}

export function maxedChallenge(layer, id) {
	return layers[layer]?.challenges?.[id]?.maxed;
}

export function challengeCompletions(layer, id) {
	return layers[layer]?.challenges?.[id]?.completions;
}

export function inChallenge(layer, id) {
	return layers[layer]?.challenges?.[id]?.active;
}

export function getBuyableAmount(layer, id) {
	return layers[layer]?.buyables?.[id]?.amount;
}

export function setBuyableAmount(layer, id, amt) {
	layers[layer].buyables[id].amount = amt;
}

export function getClickableState(layer, id) {
	return layers[layer]?.clickables?.[id]?.state;
}

export function setClickableState(layer, id, state) {
	layers[layer].clickables[id].state = state;
}

export function getGridData(layer, id, cell) {
	return layers[layer]?.grids?.[id]?.[cell];
}

export function setGridData(layer, id, cell, data) {
	layers[layer].grids[id][cell] = data;
}

export function upgradeEffect(layer, id) {
	return layers[layer]?.upgrades?.[id]?.effect;
}

export function challengeEffect(layer, id) {
	return layers[layer]?.challenges?.[id]?.rewardEffect;
}

export function buyableEffect(layer, id) {
	return layers[layer]?.buyables?.[id]?.effect;
}

export function clickableEffect(layer, id) {
	return layers[layer]?.clickables?.[id]?.effect;
}

export function achievementEffect(layer, id) {
	return layers[layer]?.achievements?.[id]?.effect;
}

export function gridEffect(layer, id, cell) {
	return layers[layer]?.grids?.[id]?.[cell]?.effect;
}
