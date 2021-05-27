import Vue from 'vue';
import App from './App';
import store from './store';
import { layers, hotkeys } from './store/layers';
import { setVue } from './util/vue';
import './components/index';

// Setup
Vue.config.productionTip = false;

// Create Vue
const vue = window.vue = new Vue({
	store,
	render: h => h(App),
	data: { layers, hotkeys }
}).$mount('#app');

setVue(vue);

// Start game loop
