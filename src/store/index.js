import Vue from 'vue'
import Vuex from 'vuex'
import { getInitialStore } from '../util/load.js';
import mutations from './mutations';

Vue.use(Vuex)

export default new Vuex.Store({
	state: getInitialStore(),
	mutations
})
