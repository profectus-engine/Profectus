<template>
	<div class="tabs">
		<div v-for="(tab, index) in tabs" class="tab" :key="index">
			<button v-if="index > 0" class="goBack" @click="goBack(index)">←</button>
			{{ tab }}
			<div class="separator" v-if="index !== tabs.length - 1"></div>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
	name: 'Tabs',
	computed: mapState([ 'tabs' ]),
	methods: {
		goBack(/* index */) {
			// TODO tabs.splice(index)
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
</style>
