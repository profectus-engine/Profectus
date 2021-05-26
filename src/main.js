import Vue from 'vue';
import App from './App';
import store from './store';
import { layers, hotkeys } from './store/layers';

// Setup
Vue.config.productionTip = false;

// Create Vue
window.vue = new Vue({
	store,
	render: h => h(App),
	data: { layers, hotkeys }
}).$mount('#app');

// Start game loop
