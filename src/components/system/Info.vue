<template>
	<Modal :show="show" @close="$emit('closeDialog', 'Info')">
		<div slot="header" class="info-modal-header">
			<img class="info-modal-logo" v-if="logo" :src="logo" :alt="title" />
			<div class="info-modal-title">
				<h2>{{ title }}</h2>
				<h4>v{{ versionNumber}}: {{ versionTitle }}</h4>
			</div>
		</div>
		<div slot="body">
			<div v-if="author">
				By {{ author }}
			</div>
			<div>
				Made in TMT-X, by thepaperpilot with inspiration from Acameada, Jacorb, and Aarex
			</div>
			<br/>
			<div class="link" @click="$emit('openDialog', 'Changelog')">Changelog</div>
			<br>
			<div>
				<a :href="discordLink" v-if="discordLink !== 'https://discord.gg/WzejVAx'">
					<img src="images/discord.png" class="info-modal-discord" />
					{{ discordLink }}
				</a>
			</div>
			<div>
				<a href="https://discord.gg/WzejVAx" class="info-modal-discord-link">
					<img src="images/discord.png" class="info-modal-discord" />
					The Paper Pilot Community
				</a>
			</div>
			<div>
				<a href="https://discord.gg/F3xveHV" class="info-modal-discord-link">
					<img src="images/discord.png" class="info-modal-discord" />
					The Modding Tree
				</a>
			</div>
			<div>
				<a href="https://discord.gg/wwQfgPa" class="info-modal-discord-link">
					<img src="images/discord.png" class="info-modal-discord" />
					Jacorb's Games
				</a>
			</div>
			<br>
			<div>Time Played: {{ timePlayed }}</div>
			<div v-if="hotkeys.length > 0">
				<br>
				<h4>Hotkeys</h4>
				<div v-for="key in hotkeys" :key="key.key">
					{{ key.key }}: {{ key.description }}
				</div>
			</div>
		</div>
	</Modal>
</template>

<script>
import modInfo from '../../data/modInfo';
import { formatTime } from '../../util/bignum';
import { hotkeys } from '../../store/layers';

export default {
	name: 'Info',
	data() {
		const { title, logo, author, discordName, discordLink, versionNumber, versionTitle } = modInfo;
		return { title, logo, author, discordName, discordLink, versionNumber, versionTitle };
	},
	props: {
		show: Boolean
	},
	computed: {
		timePlayed() {
			return formatTime(this.$store.state.timePlayed);
		},
		hotkeys() {
			// TODO check layer is unlocked and hotkey is unlocked
			return hotkeys.filter(hotkey => hotkey || true);
		}
	}
};
</script>

<style scoped>
.info-modal-header {
	display: flex;
    margin: -20px;
    margin-bottom: 0;
    background: var(--secondary-background);
    align-items: center;
}

.info-modal-header * {
	margin: 0;
}

.info-modal-logo {
	height: 4em;
    width: 4em;
}

.info-modal-title {
	display: flex;
	flex-direction: column;
	padding: 10px 0;
    margin-left: 10px;
}

.info-modal-discord-link {
	display: flex;
	align-items: center;
}

.info-modal-discord {
	height: 2em;
	margin: 0;
	margin-right: 4px;
}
</style>
