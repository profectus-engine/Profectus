import Decimal from './bignum';
import { isPlainObject } from './common';
import { layers } from '../store/layers';

export function resetLayer(layer, force = false) {
	layers[layer].reset(force);
}

export function resetLayerData(layer, keep = []) {
	layers[layer].resetData(keep);
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
