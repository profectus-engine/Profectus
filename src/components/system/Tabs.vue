<template>
	<perfect-scrollbar class="tabs-container">
		<div class="tabs">
			<div v-for="(tab, index) in tabs" :key="index" class="tab">
				<button v-if="index > 0" class="goBack" @click="goBack(index)">←</button>
				<perfect-scrollbar>
					<div class="inner-tab">
						<LayerProvider :layer="tab" :index="index" v-if="tab in components && components[tab]">
							<component :is="components[tab]" />
						</LayerProvider>
						<layer-tab :layer="tab" :index="index" v-else-if="tab in components" />
						<component :is="tab" :index="index" v-else />
					</div>
				</perfect-scrollbar>
				<div class="separator" v-if="index !== tabs.length - 1"></div>
			</div>
		</div>
	</perfect-scrollbar>
</template>

<script>
import { mapState } from 'vuex';
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';

export default {
	name: 'Tabs',
	computed: {
		...mapState([ 'tabs' ]),
		components() {
			return Object.keys(layers).reduce((acc, curr) => {
				acc[curr] = layers[curr].component || false;
				return acc;
			}, {});
		}
	},
	methods: {
		goBack(index) {
			player.tabs = player.tabs.slice(0, index);
		}
	}
};
</script>

<style scoped>
.tabs-container {
	width: 100vw;
    flex-grow: 1;
}

.tabs {
    display: flex;
    height: 100%;
}

.tab {
    position: relative;
    height: 100%;
    width: 100%;
    min-width: 640px;
}

.tab .ps {
	height: 100%;
	z-index: 0;
}

.inner-tab {
    padding: 50px 10px;
    min-height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
}

.separator {
	position: absolute;
	right: -3px;
	top: 0;
	bottom: 0;
	width: 6px;
	background: var(--separator);
    z-index: 1;
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
    z-index: 7;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--color);
}
</style>

<style>
.tabs-container > .ps__rail-x {
	z-index: 120;
}

.tab hr {
    height: 4px;
    border: none;
    background: var(--separator);
    margin: 7px -10px;
}

.tab .modal-body hr {
	margin: 7px 0;
}

.tab > .ps > .ps__rail-y {
    margin-right: 6px;
    z-index: 10;
}
</style>
