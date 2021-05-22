import Vue from 'vue';
import App from './App.vue';
import store from './store';
import { layers, hotkeys } from './data/layers.js';

// Setup
Vue.config.productionTip = false;
window.player = store.state;

// Create Vue
window.vue = new Vue({
	store,
	render: h => h(App),
	data: { layers, hotkeys }
}).$mount('#app');

// Start game loop
