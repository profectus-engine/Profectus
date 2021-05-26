<template>
	<div class="tabs">
		<div v-for="(tab, index) in tabs" class="tab" :key="index">
			<button v-if="index > 0" class="goBack" @click="goBack(index)">←</button>
			<LayerProvider :layer="tab" :index="index" v-if="tab in layers && layers[tab].component">
				<component :is="layers[tab].component" />
			</LayerProvider>
			<layer-tab :layer="tab" :index="index" v-else-if="tab in layers" />
			<component :is="tab" :index="index" v-else />
			<div class="separator" v-if="index !== tabs.length - 1"></div>
		</div>
	</div>
</template>

<script>
import LayerProvider from './LayerProvider';
import LayerTab from './LayerTab';
import { mapState } from 'vuex';
import { player } from '../../store/proxies';

export default {
	name: 'Tabs',
	data() {
		return {
			layers: this.$root.layers
		};
	},
	components: {
		LayerProvider, LayerTab
	},
	computed: mapState([ 'tabs' ]),
	methods: {
		goBack(index) {
			player.tabs.splice(0, index);
		}
	}
};
</script>

<style scoped>
.tabs {
    display: flex;
    flex-grow: 1;
    width: 100%;
}

.tab {
    position: relative;
    height: 100%;
    width: 100%;
    padding: 0 10px;
}

.separator {
	position: absolute;
	right: -3px;
	top: 0;
	bottom: 0;
	width: 6px;
	background: var(--separator);
}

.goBack {
    position: absolute;
    top: 0;
    left: 20px;
    background-color: transparent;
    border: 1px solid transparent;
    color: var(--color);
    font-size: 40px;
    cursor: pointer;
    line-height: 40px;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--color);
}
</style>
