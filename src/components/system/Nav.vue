<template>
	<div>
		<div class="nav" v-if="useHeader">
			<img v-if="banner" :src="banner" height="100%" :alt="title" />
			<div v-else class="title">{{ title }}</div>
			<div class="version" @click="openDialog('Changelog')">v{{ version }}</div>
			<div style="flex-grow: 1"></div>
			<div class="discord">
				<img src="images/discord.png" @click="window.open(discordLink, 'mywindow')" />
				<ul class="discord-links">
					<li v-if="discordLink !== 'https://discord.gg/WzejVAx'">
						<a :href="discordLink" target="_blank">{{ discordName }}</a>
					</li>
					<li><a href="https://discord.gg/WzejVAx" target="_blank">The Paper Pilot Community</a></li>
					<li><a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a></li>
					<li><a href="http://discord.gg/wwQfgPa" target="_blank">Jacorb's Games</a></li>
				</ul>
			</div>
			<div class="info" @click="openDialog('Info')"><br/>i</div>
			<img class="options" src="images/options_wheel.png" @click="openDialog('Options')" />
		</div>
		<div v-else>
			<div class="discord overlay">
				<img src="images/discord.png" @click="openDiscord" />
				<ul class="discord-links">
					<li v-if="discordLink !== 'https://discord.gg/WzejVAx'">
						<a :href="discordLink" target="_blank">{{ discordName }}</a>
					</li>
					<li><a href="https://discord.gg/WzejVAx" target="_blank">The Paper Pilot Community</a></li>
					<li><a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a></li>
					<li><a href="http://discord.gg/wwQfgPa" target="_blank">Jacorb's Games</a></li>
				</ul>
			</div>
			<div class="info overlay" @click="openDialog('Info')"><br/>i</div>
			<img class="options overlay" src="images/options_wheel.png" @click="openDialog('Options')" />
			<div class="version overlay" @click="openDialog('Changelog')">v{{ version }}</div>
		</div>
		<Info :show="showInfo" @openDialog="openDialog" @closeDialog="closeDialog" />
		<Options :show="showOptions" @closeDialog="closeDialog" />
	</div>
</template>

<script>
import modInfo from '../../data/mod.js';
import Info from './Info';
import Options from './Options';

export default {
	name: 'Nav',
	data() {
		return {
			useHeader: modInfo.useHeader,
			banner: modInfo.banner,
			title: modInfo.title,
			discordName: modInfo.discordName,
			discordLink: modInfo.discordLink,
			version: modInfo.versionNumber,
			showInfo: false,
			showOptions: false,
			showChangelog: false
		}
	},
	components: {
		Info, Options
	},
	methods: {
		openDiscord() {
			window.open(this.discordLink, 'mywindow');
		},
		openDialog(dialog) {
			this[`show${dialog}`] = true;
		},
		closeDialog(dialog) {
			this[`show${dialog}`] = false;
		}
	}
};
</script>

<style scoped>
	.nav {
		background-color: var(--secondary-background);
		display: flex;
		left: 0;
		right: 0;
		top: 0;
		height: 50px;
		width: 100%;
	}

	.title {
		font-size: 36px;
		text-align: left;
		margin-left: 12px;
	}

	.overlay {
		z-index: 100;
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
		padding: 20px;
		right: -280px;
		width: 200px;
		transition: right .25s ease;
		background: var(--secondary-background);
	}

	.discord.overlay .discord-links {
		top: 160px;
		right: unset;
		left: -280px;
		transition: left .25s ease;
	}

	.discord-links li {
		margin-bottom: 4px;
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
