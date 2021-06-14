import { layers } from './layers';
import { isFunction, isPlainObject } from '../util/common';
import Decimal from '../util/bignum';
import store from './index';
import Vue from 'vue';

export const tmp = new Proxy({}, {
	get(target, property) {
		if (property in layers) {
			return layers[property];
		}
		// TODO implement other tmp values for backwards compatibility
		console.error(`No getter for "${property}"`, target);
	}
});

const playerHandler = {
	get(target, key) {
		if (key === 'isProxy') {
			return true;
		}

		if (typeof target[key] == "undefined") {
			return;
		}

		if (!target[key].isProxy && !(target[key] instanceof Decimal) && (isPlainObject(target[key]) || Array.isArray(target[key]))) {
			// Note that player isn't pre-created since it (shouldn't) have functions or getters
			// so creating proxies as they're requested is A-OK
			target[key] = new Proxy(target[key], playerHandler);
			return target[key];
		}

		return target[key];
	},
	set(target, property, value) {
		Vue.set(target, property, value);
		if (property === 'points') {
			if (target.best != undefined) {
				target.best = Decimal.max(target.best, value);
			}
			if (target.total != undefined) {
				const diff = Decimal.sub(value, target.points);
				if (diff.gt(0)) {
					target.total = target.total.add(diff);
				}
			}
		}
		return true;
	}
};
export const player = window.player = new Proxy(store.state, playerHandler);

export function createProxy(object, getters, prefix) {
	if (object.isProxy) {
		console.warn("Creating a proxy out of a proxy! This may cause unintentional function calls and stack overflows.");
	}
	const objectProxy = new Proxy(object, getHandler(prefix));
	travel(createProxy, object, objectProxy, getters, prefix);
	return objectProxy;
}

// TODO cache grid values? Currently they'll be calculated every render they're visible
export function createGridProxy(object, getters, prefix) {
	if (object.isProxy) {
		console.warn("Creating a proxy out of a proxy! This may cause unintentional function calls and stack overflows.");
	}
	const objectProxy = new Proxy(object, getGridHandler(prefix));
	travel(createGridProxy, object, objectProxy, getters, prefix);
	return objectProxy;
}

function travel(callback, object, objectProxy, getters, prefix) {
	for (let key in object) {
		if (object[key].isProxy) {
			continue;
		}
		if (isFunction(object[key])) {
			if ((object[key].length !== 0 && object[key].forceCached !== true) || object[key].forceCached === false) {
				continue;
			}
			getters[`${prefix}${key}`] = () => {
				return object[key].call(objectProxy);
			}
		} else if ((isPlainObject(object[key]) || Array.isArray(object[key])) && !(object[key] instanceof Decimal)) {
			object[key] = callback(object[key], getters, `${prefix}${key}-`);
		}
	}
}

function getHandler(prefix) {
	return {
		get(target, key, receiver) {
			if (key === 'isProxy') {
				return true;
			}

			if (typeof target[key] == "undefined") {
				return;
			}

			if (target[key].isProxy || target[key] instanceof Decimal) {
				return target[key];
			} else if ((isPlainObject(target[key]) || Array.isArray(target[key])) && key.slice(0, 2) !== '__') {
				console.warn("Creating proxy outside `createProxy`. This may cause issues when calling proxied functions.",
					target, key);
				target[key] = new Proxy(target[key], getHandler(`${prefix}${key}-`));
				return target[key];
			} else if (isFunction(target[key])) {
				const getterID = `${prefix}${key}`;
				if (getterID in store.getters) {
					return store.getters[getterID];
				} else {
					return target[key].bind(receiver);
				}
			}
			return target[key];
		},
		set(target, key, value, receiver) {
			if (`${key}Set` in target && isFunction(target[`${key}Set`]) && target[`${key}Set`].length < 2) {
				target[`${key}Set`].call(receiver, value);
				return true;
			} else {
				console.warn(`No setter for "${key}".`, target);
			}
		}
	};
}

function getGridHandler(prefix) {
	return {
		get(target, key, receiver) {
			if (key === 'isProxy') {
				return true;
			}

			if (target[key] && (target[key].isProxy || target[key] instanceof Decimal)) {
				return target[key];
			} else if (isPlainObject(target[key]) || Array.isArray(target[key])) {
				console.warn("Creating proxy outside `createProxy`. This may cause issues when calling proxied functions.",
					target, key);
				target[key] = new Proxy(target[key], getHandler(`${prefix}${key}-`));
				return target[key];
			} else if (isFunction(target[key])) {
				const getterID = `${prefix}${key}`;
				if (getterID in store.getters) {
					return store.getters[getterID]();
				} else {
					return target[key].bind(receiver);
				}
			}
			if (!isNaN(key)) {
				target[key] = new Proxy(target, getCellHandler(key));
			}
			return target[key];
		},
		set(target, key, value, receiver) {
			if (`${key}Set` in target && isFunction(target[`${key}Set`]) && target[`${key}Set`].length < 2) {
				target[`${key}Set`].call(receiver, value);
				return true;
			} else {
				console.warn(`No setter for "${key}".`, target);
			}
		}
	};
}

function getCellHandler(id) {
	return {
		get(target, key, receiver) {
			if (key === 'isProxy') {
				return true;
			}

			let prop = target[key];
			if (isFunction(prop)) {
				return prop.call(receiver, id, target.data(id));
			} else if (prop != undefined) {
				return prop;
			}

			if (key.slice == undefined) {
				return prop;
			}

			key = key.slice(0, 1).toUpperCase() + key.slice(1);
			prop = target[`get${key}`];
			if (isFunction(prop)) {
				return prop.call(receiver, id, target.data(id));
			} else if (prop != undefined) {
				return prop;
			}

			prop = target[`on${key}`];
			if (isFunction(prop)) {
				return () => prop.call(receiver, id, target.data(id));
			} else if (prop != undefined) {
				return prop;
			}

			return target[key];
		},
		set(target, key, value, receiver) {
			if (`${key}Set` in target && isFunction(target[`${key}Set`]) && target[`${key}Set`].length < 3) {
				target[`${key}Set`].call(receiver, id, value);
				return true;
			} else {
				console.warn(`No setter for "${key}".`, target);
			}
		}
	};
}
