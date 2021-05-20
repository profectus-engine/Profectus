<template>
	<div class="nav" v-if="useHeader">
		<img v-if="banner" :src="banner" height="100%" :alt="title" />
		<div v-else class="title">{{ title }}</div>
		<div class="version" @click="showTab('changelog-tab')">v{{ version }}</div>
		<div style="flex-grow: 1"></div>
		<div class="discord">
			<img src="images/discord.png" @click="window.open(discordLink, 'mywindow')" />
			<ul class="discord-links">
				<li v-if="discordLink !== 'https://discord.gg/WzejVAx'">
					<a :href="discordLink" target="_blank">{{ discordName }}</a>
				</li>
				<li><a href="https://discord.gg/WzejVAx" target="_blank">TMT-X Server</a></li>
				<li><a href="https://discord.gg/F3xveHV" target="_blank">TMT Server</a></li>
				<li><a href="http://discord.gg/wwQfgPa" target="_blank">TPT Server</a></li>
			</ul>
		</div>
		<div v-if="tab !== 'info-tab'" class="info" @click="showTab('info-tab')"><br/>i</div>
		<img v-if="tab !== 'options-tab'" class="options" src="images/options_wheel.png"
			@click="showTab('options-tab')" />
	</div>
	<div v-else>
		<div class="discord overlay">
			<img src="images/discord.png" @click="openDiscord" />
			<ul class="discord-links">
				<li v-if="discordLink !== 'https://discord.gg/WzejVAx'">
					<a :href="discordLink" target="_blank">{{ discordName }}</a>
				</li>
				<li><a href="https://discord.gg/WzejVAx" target="_blank">TMT-X Server</a></li>
				<li><a href="https://discord.gg/F3xveHV" target="_blank">TMT Server</a></li>
				<li><a href="http://discord.gg/wwQfgPa" target="_blank">TPT Server</a></li>
			</ul>
		</div>
		<div v-if="tab !== 'info-tab'" class="info overlay" @click="showTab('info-tab')"><br/>i</div>
		<img v-if="tab !== 'options-tab'" class="options overlay" src="images/options_wheel.png"
			@click="showTab('options-tab')" />
		<div class="version overlay" @click="showTab('changelog-tab')">v{{ version }}</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import modInfo from '../../data/mod.js';

export default {
	name: 'Nav',
	data() {
		return {
			useHeader: modInfo.useHeader,
			banner: modInfo.banner,
			title: modInfo.title,
			discordName: modInfo.discordName,
			discordLink: modInfo.discordLink,
			version: modInfo.versionNumber
		}
	},
	computed: mapState([ 'tab' ]),
	methods: {
		openDiscord() {
			window.open(this.discordLink, 'mywindow');
		},
		showTab(tab) {
			console.log("TODO show tab", tab);
		}
	}
};
</script>

<style scoped>
	.nav {
		background-color: var(--background_nav);
		display: flex;
		left: 0;
		right: 0;
		top: 0;
		height: 50px;
		z-index: 9999999;
	}

	.title {
		font-size: 36px;
		text-align: left;
		margin-left: 12px;
	}

	.discord {
		width: 40px;
		height: 40px;
		cursor: pointer;
	}

	.discord.overlay {
		position: absolute;
		top: 120px;
		left: 4px;
	}

	.discord img {
		width: 100%;
		height: 100%;
	}

	.discord-links {
		position: fixed;
		top: 45px;
		padding: 30px;
		right: -280px;
		width: 200px;
		transition: right .25s ease;
		background: var(--background_nav);
	}

	.discord.overlay .discord-links {
		top: 160px;
		right: unset;
		left: -280px;
		transition: left .25s ease;
	}

	.discord:not(.overlay):hover .discord-links {
		right: 0;
	}

	.discord.overlay:hover .discord-links {
		left: 0;
	}

	.info {
		font-size: 20px;
		color: var(--link);
		line-height: 14px;
		width: 40px;
		height: 40px;
		cursor: pointer;
	}

	.info.overlay {
		position: absolute;
		top: 60px;
		left: 4px;
	}

	.info:hover {
		transform: scale(1.2, 1.2);
		text-shadow: 5px 0 10px var(--link),
			-3px 0 12px var(--link);
	}

	.options {
		height: 50px;
		width: 50px;
		cursor: pointer;
		transition-duration: .5s;
	}

	.options.overlay {
		position: absolute;
		top: 0;
		left: 0;
	}

	.options:hover {
		transform: rotate(360deg);
	}

	.version {
		margin-left: 12px;
		margin-right: 12px;
		margin-bottom: 7px;
		color: var(--points);
		cursor: pointer;
	}

	.version.overlay {
		position: absolute;
		right: 4px;
		top: 4px;
	}

	.version:hover {
		transform: scale(1.2, 1.2);
		text-shadow: 5px 0 10px var(--points), -3px 0 12px var(--points);
	}
</style>
