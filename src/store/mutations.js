import Vue from 'vue';

export const SET_TABS = 'SET_TABS';
export const SET_SETTING = 'SET_SETTING';

export default {
	[SET_TABS](state, tabs) {
		Vue.set(state, 'tabs', tabs);
	},
	[SET_SETTING](state, { setting, value }) {
		if (value == null) {
			value = !state[setting];
		}
		state[setting] = value;
	}
};
