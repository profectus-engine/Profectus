// Import and register all components,
// which will allow us to use them in any template strings anywhere in the project

import Vue from 'vue';

/* system */
import DefaultLayerTab from './system/DefaultLayerTab';
import Info from './system/Info';
import LayerProvider from './system/LayerProvider';
import LayerTab from './system/LayerTab';
import Modal from './system/Modal';
import Nav from './system/Nav';
import Options from './system/Options';
import Resource from './system/Resource';
import Tabs from './system/Tabs';
import TPS from './system/TPS';
/* fields */
import Select from './fields/Select';
import Toggle from './fields/Toggle';
/* features */
import MainDisplay from './features/MainDisplay';
/* misc */
import { Fragment } from 'vue-fragment';

/* system */
Vue.component(DefaultLayerTab.name, DefaultLayerTab);
Vue.component(Info.name, Info);
Vue.component(LayerProvider.name, LayerProvider);
Vue.component(LayerTab.name, LayerTab);
Vue.component(Modal.name, Modal);
Vue.component(Nav.name, Nav);
Vue.component(Options.name, Options);
Vue.component(Resource.name, Resource);
Vue.component(Tabs.name, Tabs);
Vue.component(TPS.name, TPS);
/* fields */
Vue.component(Select.name, Select);
Vue.component(Toggle.name, Toggle);
/* features */
Vue.component(MainDisplay.name, MainDisplay);
/* misc */
Vue.component(Fragment.name, Fragment);
