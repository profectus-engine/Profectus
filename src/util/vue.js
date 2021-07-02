import { player } from '../store/proxies';
import { layers } from '../store/layers';
import { hasUpgrade, hasMilestone, hasAchievement, hasChallenge, maxedChallenge, challengeCompletions, inChallenge, getBuyableAmount, setBuyableAmount, getClickableState, setClickableState, getGridData, setGridData, upgradeEffect, challengeEffect, buyableEffect, clickableEffect, achievementEffect, gridEffect } from './features';
import Decimal, * as numberUtils from './bignum';

let vue;
export function setVue(vm) {
	vue = vm;
}

// Pass in various data that the template could potentially use
const computed = {
	player() { return player; },
	layers() { return layers; }
};
const data = function() {
	return { Decimal, ...numberUtils };
}
export function coerceComponent(component, defaultWrapper = 'span') {
	if (typeof component === 'number') {
		component = "" + component;
	}
	if (typeof component === 'string') {
		component = component.trim();
		if (!(component in vue.$options.components)) {
			if (component.charAt(0) !== '<') {
				component = `<${defaultWrapper}>${component}</${defaultWrapper}>`;
			}

			return { template: component, computed, data, inject: [ 'tab' ], methods: { hasUpgrade, hasMilestone, hasAchievement, hasChallenge, maxedChallenge, challengeCompletions, inChallenge, getBuyableAmount, setBuyableAmount, getClickableState, setClickableState, getGridData, setGridData, upgradeEffect, challengeEffect, buyableEffect, clickableEffect, achievementEffect, gridEffect } };
		}
	}
	return component;
}

export function getFiltered(objects, filter = null) {
	if (filter) {
		filter = filter.map(v => v.toString());
		return Object.keys(objects)
			.filter(key => filter.includes(key))
			.reduce((acc, curr) => {
				acc[curr] = objects[curr];
				return acc;
			}, {});
	}
	return objects;
}

export const UP = 'UP';
export const DOWN = 'DOWN';
export const LEFT = 'LEFT';
export const RIGHT = 'RIGHT';
export const DEFAULT = 'DEFAULT';
