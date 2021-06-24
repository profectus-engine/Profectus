<template>
	<div v-frag>
		<div class="nav" v-if="useHeader">
			<img v-if="banner" :src="banner" height="100%" :alt="title" />
			<div v-else class="title">{{ title }}</div>
			<tooltip display="Changelog" bottom><div class="version" @click="openDialog('Changelog')">v{{ version }}</div></tooltip>
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
			<tooltip display="<span>Info</span>" bottom yoffset="4px">
				<div class="info" @click="openDialog('Info')"><br/>i</div>
			</tooltip>
			<tooltip display="Saves" bottom xoffset="-24px" style="margin-top: 6px">
				<div class="material-icons saves" @click="openDialog('Saves')">library_books</div>
			</tooltip>
			<tooltip display="<span>Options</span>" bottom xoffset="-64px" yoffset="-8px">
				<img class="options" src="images/options_wheel.png" @click="openDialog('Options')" />
			</tooltip>
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
			<tooltip display="<span>Info</span>" right>
				<img class="options overlay" src="images/options_wheel.png" @click="openDialog('Saves')" />
			</tooltip>
			<tooltip display="Saves" right>
				<div class="material-icons saves overlay" @click="openDialog('Saves')">library_books</div>
			</tooltip>
			<tooltip display="<span>Options</span>" right>
				<img class="options overlay" src="images/options_wheel.png" @click="openDialog('Options')" />
			</tooltip>
			<tooltip display="Changelog" right>
				<div class="version overlay" @click="openDialog('Changelog')">v{{ version }}</div>
			</tooltip>
		</div>
		<Info :show="showInfo" @openDialog="openDialog" @closeDialog="closeDialog" />
		<SavesManager :show="showSaves" @closeDialog="closeDialog" />
		<Options :show="showOptions" @closeDialog="closeDialog" />
	</div>
</template>

<script>
import modInfo from '../../data/modInfo';

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
			showSaves: false,
			showOptions: false,
			showChangelog: false
		}
	},
	methods: {
		openDiscord() {
			window.open(this.discordLink, 'mywindow');
		},
		openDialog(dialog) {
			this[`show${dialog}`] = true;
			console.log(`show${dialog}`, this[`show${dialog}`]);
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
		height: 46px;
		width: 100%;
		border-bottom: 4px solid var(--separator);
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
		z-index: 1;
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

	.saves {
		font-size: 36px;
		cursor: pointer;
	}

	.saves:hover {
		transform: scale(1.2, 1.2);
		text-shadow: 5px 0 10px var(--color),
			-3px 0 12px var(--color);
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

	.nav > .title + .tooltip-container {
		margin-left: 12px;
		margin-right: 12px;
		margin-bottom: 5px;
	}
</style>
