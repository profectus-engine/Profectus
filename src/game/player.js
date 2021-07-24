import { reactive } from 'vue';
import { isPlainObject } from '../util/common';
import Decimal from '../util/bignum';

const state = reactive({});

const playerHandler = {
	get(target, key) {
		if (key === '__state' || key === '__path') {
			return target[key];
		}
		if (target.__state[key] == undefined) {
			return;
		}
		if (isPlainObject(target.__state[key]) && !(target.__state[key] instanceof Decimal)) {
			if (target.__state[key] !== target[key]?.__state) {
				const path = [ ...target.__path, key ];
				target[key] = new Proxy({ __state: target.__state[key], __path: path }, playerHandler);
			}
			return target[key];
		}

		return target.__state[key];
	},
	set(target, property, value, receiver) {
		if (!state.hasNaN && ((typeof value === 'number' && isNaN(value)) || (value instanceof Decimal && (isNaN(value.sign) || isNaN(value.layer) || isNaN(value.mag))))) {
			const currentValue = target.__state[property];
			if (!((typeof currentValue === 'number' && isNaN(currentValue)) || (currentValue instanceof Decimal && (isNaN(currentValue.sign) || isNaN(currentValue.layer) || isNaN(currentValue.mag))))) {
				state.autosave = false;
				state.hasNaN = true;
				state.NaNPath = [ ...target.__path, property ];
				state.NaNReceiver = receiver;
				console.error(`Attempted to set NaN value`, [ ...target.__path, property ], target.__state);
				throw 'Attempted to set NaN value. See above for details';
			}
		}
		target.__state[property] = value;
		if (property === 'points') {
			if (target.__state.best != undefined) {
				target.__state.best = Decimal.max(target.__state.best, value);
			}
			if (target.__state.total != undefined) {
				const diff = Decimal.sub(value, target.__state.points);
				if (diff.gt(0)) {
					target.__state.total = target.__state.total.add(diff);
				}
			}
		}
		return true;
	}
};
export default window.player = new Proxy({ __state: state, __path: [ 'player' ] }, playerHandler);
