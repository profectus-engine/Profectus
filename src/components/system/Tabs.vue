<template>
	<simplebar class="tabs-container">
		<div v-for="(tab, index) in tabs" :key="index" class="tab" :ref="`tab-${index}`">
			<simplebar>
				<div class="inner-tab">
					<LayerProvider :layer="tab" :index="index" v-if="tab in components && components[tab]">
						<component :is="components[tab]" />
					</LayerProvider>
					<layer-tab :layer="tab" :index="index" v-else-if="tab in components" :minimizable="true"
						:tab="() => $refs[`tab-${index}`] && $refs[`tab-${index}`][0]" />
					<component :is="tab" :index="index" v-else />
				</div>
			</simplebar>
			<div class="separator" v-if="index !== tabs.length - 1"></div>
		</div>
	</simplebar>
</template>

<script>
import { mapState } from 'vuex';
import { layers } from '../../store/layers';

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
	}
};
</script>

<style scoped>
.tabs-container {
	width: 100vw;
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
}

.tabs {
    display: flex;
    height: 100%;
}

.tab {
    position: relative;
    height: 100%;
    flex-grow: 1;
    transition-duration: 0s;
}

.inner-tab {
    padding: 50px 10px;
    min-height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    margin: 0;
    flex-grow: 1;
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

.tab > [data-simplebar] {
    height: 100%;
    overflow-x: hidden;
}
</style>

<style>
.tab hr {
    height: 4px;
    border: none;
    background: var(--separator);
    margin: 7px -10px;
}

.tab .modal-body hr {
	margin: 7px 0;
}

.tabs-container > .simplebar-wrapper > .simplebar-mask > .simplebar-offset > .simplebar-content-wrapper > .simplebar-content {
	display: flex;
	height: 100vh;
}

.useHeader .tabs-container > .simplebar-wrapper > .simplebar-mask > .simplebar-offset > .simplebar-content-wrapper > .simplebar-content {
	height: calc(100vh - 50px);
}

.tab > [data-simplebar] > .simplebar-wrapper > .simplebar-mask > .simplebar-offset > .simplebar-content-wrapper {
	position: static;
}

.tab > [data-simplebar] > .simplebar-wrapper > .simplebar-mask > .simplebar-offset > .simplebar-content-wrapper > .simplebar-content {
    flex-direction: column;
    min-height: 100%;
}
</style>
