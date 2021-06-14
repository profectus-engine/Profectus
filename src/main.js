import Vue from 'vue';
import App from './App';
import store from './store';
import { addLayer} from './store/layers';
import { setVue } from './util/vue';
import { startGameLoop } from './store/game';
import './components/index';

// Setup
Vue.config.productionTip = false;

requestAnimationFrame(async () => {
	// Add layers on second frame so dependencies can resolve
	const { initialLayers } = await import('./data/mod');
	initialLayers.forEach(addLayer);

	// Create Vue
	const vue = window.vue = new Vue({
		store,
		render: h => h(App)
	});
	setVue(vue);
	vue.$mount('#app');

	startGameLoop();
});
