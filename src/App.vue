<template>
	<div id="app" @mousemove="updateMouse" :style="theme">
		<Nav />
		<Tabs />
		<TPS v-if="showTPS" />
	</div>
</template>

<script>
import Nav from './components/system/Nav';
import Tabs from './components/system/Tabs';
import TPS from './components/system/TPS';
import themes from './data/themes';
import { mapState } from 'vuex';

export default {
	name: 'App',
	components: {
		Nav, Tabs, TPS
	},
	computed: {
		...mapState([ 'showTPS' ]),
		theme() {
			return themes[this.$store.state.theme || "default"];
		}
	},
	methods: {
		updateMouse(/* event */) {
			// TODO use event to update mouse position for particles
		}
	}
};
</script>

<style>
* {
	transition-duration: 0.5s;
	font-family: "Roboto Mono", monospace;
	font-weight: bold;
	margin: auto;
	text-size-adjust: none;
}

*:focus {
	outline: none;
}

body {
	overflow: hidden;
	min-width: 640px;
	transition: none;
	text-align: center;
}

html, body, #app {
	min-height: 100%;
	height: 100%;
}

h1, h2, h3, b, input {
	display: inline;
}

a,
button,
.link {
	display: block;
	color: var(--link);
	background: none;
	border: none;
	cursor: pointer;
	text-decoration: none;
}

a:hover,
button:hover,
.link:hover {
	text-shadow: 5px 0 10px var(--link),
		-3px 0 12px var(--link);
}

ul {
	list-style-type: none;
}

#app {
	background-color: var(--background);
	color: var(--color);
	display: flex;
	flex-flow: column;
}
</style>
