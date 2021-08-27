// Import and register all components,
// which will allow us to use them in any template strings anywhere in the project

import CollapseTransition from "@ivanv/vue-collapse-transition/src/CollapseTransition.vue";
import { App } from "vue";
import VueNextSelect from "vue-next-select";
import "vue-next-select/dist/index.css";
import panZoom from "vue-panzoom";
import Sortable from "vue-sortable";
import VueTextareaAutosize from "vue-textarea-autosize";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

export function registerComponents(vue: App): void {
    /* from files */
    const componentsContext = require.context("./");
    componentsContext.keys().forEach(path => {
        const component = componentsContext(path).default;
        if (component && !(component.name in vue._context.components)) {
            vue.component(component.name, component);
        }
    });

    /* from packages */
    vue.component("collapse-transition", CollapseTransition);
    vue.use(VueTextareaAutosize);
    vue.use(Sortable);
    vue.component("vue-select", VueNextSelect);
    vue.use(panZoom);
    vue.use(Toast);
}
