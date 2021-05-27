import { player } from '../store/proxies';
import { layers } from '../store/layers';
import Decimal, * as numberUtils from './bignum';

let vue;
export function setVue(vm) {
	vue = vm;
}

// Pass in various data that the template could potentially use
const defaultComputed = {
	player() { return player; },
	layers() { return layers; }
};
const defaultData = function() {
	return { Decimal, ...numberUtils };
}
export function coerceComponent(component) {
	if (typeof component === 'string' && !(component in vue.$options.components)) {
		let computed = defaultComputed;
		let data = defaultData;
		if (component.charAt(0) !== '<') {
			// Not a template string, so make it one and remove the data
			component = `<span>${component}</span>`;
			computed = null;
			data = null;
		}

		return { template: component, computed, data };
	}
	return component;
}