import { player } from '../store/proxies';
import { layers } from '../store/layers';
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

			return { template: component, computed, data, inject: [ 'tab' ] };
		}
	}
	return component;
}

export function getFiltered(objects, filter = null) {
	if (filter) {
		return Object.keys(objects)
			.filter(key => key in filter)
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
