import Vue from 'vue'
import Vuex from 'vuex'
import { getInitialStore } from '../util/load';

Vue.use(Vuex);

export default new Vuex.Store({
	state: getInitialStore()
});
