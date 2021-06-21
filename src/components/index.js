// Import and register all components,
// which will allow us to use them in any template strings anywhere in the project

import Vue from 'vue';

/* from files */
const componentsContext = require.context('./');
componentsContext.keys().forEach(path => {
	const component = componentsContext(path).default;
	if (component) {
		Vue.component(component.name, component);
	}
});

/* from packages */
import frag from 'vue-frag';
Vue.directive('frag', frag);
import TransitionExpand from 'vue-transition-expand';
import 'vue-transition-expand/dist/vue-transition-expand.css';
Vue.use(TransitionExpand);
import PerfectScrollbar from 'vue2-perfect-scrollbar';
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css';
Vue.use(PerfectScrollbar);
import VueTextareaAutosize from 'vue-textarea-autosize';
Vue.use(VueTextareaAutosize);
import PortalVue from 'portal-vue';
Vue.use(PortalVue);
import Sortable from 'vue-sortable';
Vue.use(Sortable);
