<template>
	<div id="app" @mousemove="updateMouse" :style="theme">
		<Nav />
		<TPS v-if="showTPS || true" />
	</div>
</template>

<script>
import Nav from './components/system/Nav.vue';
import TPS from './components/system/TPS.vue';
import themes from './data/themes.js';
import { mapState } from 'vuex';

export default {
	name: 'App',
	components: {
		Nav, TPS
	},
	computed: {
		...mapState([ 'showTPS' ]),
		theme() {
			return themes[this.$store.state.theme || "default"];
		}
	},
	methods: {
		updateMouse(event) {
			console.log("TODO updateMouse", event)
		}
	}
};
</script>

<style>
* {
	transition-duration: 0.5s;
	text-align: center;
	font-family: "Roboto Mono", monospace;
	font-weight: bold;
	table-align: center;
	margin: auto;
	-webkit-text-size-adjust: none;
	text-size-adjust: none;
}

*:focus {
	outline: none;
	webkit-outline: none;
}

body {
	overflow: hidden;
	min-width: 640px;
	transition: none;
}

html, body, #app {
	min-height: 100%;
	height: 100%;
}

h1, h2, h3, b, input {
	display: inline;
}

a,
.link {
    display: block;
    font-size: 20px;
    color: #02f2f2;
    cursor: pointer;
    text-decoration: none;
}

a:hover,
.link:hover {
    transform: scale(1.2, 1.2);
    text-shadow: 5px 0 10px #02f2f2,
    -3px 0 12px #02f2f2;
}

ul {
    list-style-type: none;
}

#app {
	background-color: var(--background);
	color: var(--color);
}
</style>
