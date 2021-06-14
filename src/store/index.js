import Vue from 'vue'
import Vuex from 'vuex'
import { getInitialStore } from '../util/load';
import { getters } from '../data/mod';

Vue.use(Vuex);

export default new Vuex.Store({
	state: getInitialStore(),
	getters
});
