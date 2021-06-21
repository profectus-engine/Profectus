import Vue from 'vue';
import App from './App';
import store from './store';
import { load } from './util/save';
import { setVue } from './util/vue';
import { startGameLoop } from './store/game';
import './components/index';

// Setup
Vue.config.productionTip = false;

requestAnimationFrame(async () => {
	await load();

	// Create Vue
	const vue = window.vue = new Vue({
		store,
		render: h => h(App)
	});
	setVue(vue);
	vue.$mount('#app');

	startGameLoop();
});
