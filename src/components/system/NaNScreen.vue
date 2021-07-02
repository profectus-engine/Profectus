<template>
	<div v-frag>
		<Modal :show="show">
			<div slot="header" class="nan-modal-header">
				<h2>NaN value detected!</h2>
			</div>
			<div slot="body">
				<div>Attempted to assign NaN value to "{{ property }}" (previously {{ format(previous) }}). Auto-saving has been {{ autosave ? 'enabled' : 'disabled' }}. Check the console for more details, and consider sharing it with the developers on discord.</div>
				<br>
				<div>
					<a :href="discordLink" class="nan-modal-discord-link">
						<img src="images/discord.png" class="nan-modal-discord" />
						{{ discordName }}
					</a>
				</div>
				<br>
				<Toggle title="Autosave" :value="autosave" @change="setAutosave" />
				<Toggle title="Pause game" :value="paused" @change="togglePaused" />
			</div>
			<div slot="footer" class="nan-footer">
				<button @click="toggleSavesManager" class="button">Open Saves Manager</button>
				<button @click="setZero" class="button">Set to 0</button>
				<button @click="setOne" class="button">Set to 1</button>
				<button @click="setPrev" class="button" v-if="previous && previous.neq(0) && previous.neq(1)">Set to previous</button>
				<button @click="ignore" class="button danger">Ignore</button>
			</div>
		</Modal>
		<SavesManager :show="showSaves" @closeDialog="toggleSavesManager" />
	</div>
</template>

<script>
import modInfo from '../../data/modInfo.json';
import Decimal, { format } from '../../util/bignum';
import { player } from '../../store/proxies';

export default {
	name: 'NaNScreen',
	data() {
		const { discordName, discordLink } = modInfo;
		return { discordName, discordLink, format, showSaves: false };
	},
	computed: {
		show() {
			return player.hasNaN;
		},
		property() {
			return player.NaNProperty;
		},
		autosave() {
			return player.autosave;
		},
		previous() {
			return player.NaNPrevious;
		},
		paused() {
			return player.devSpeed === 0;
		}
	},
	methods: {
		setZero() {
			player.NaNReceiver[player.NaNProperty] = new Decimal(0);
			player.hasNaN = false;
		},
		setOne() {
			player.NaNReceiver[player.NaNProperty] = new Decimal(1);
			player.hasNaN = false;
		},
		setPrev() {
			player.NaNReceiver[player.NaNProperty] = player.NaNPrevious;
			player.hasNaN = false;
		},
		ignore() {
			player.hasNaN = false;
		},
		setAutosave(autosave) {
			player.autosave = autosave;
		},
		toggleSavesManager() {
			this.showSaves = !this.showSaves;
		},
		togglePaused() {
			player.devSpeed = this.paused ? 1 : 0;
		}
	}
};
</script>

<style scoped>
.nan-modal-header {
	padding: 10px 0;
    margin-left: 10px;
}

.nan-footer {
	display: flex;
    justify-content: flex-end;
}

.nan-footer button {
	margin: 0 10px;
}

.nan-modal-discord-link {
	display: flex;
	align-items: center;
}

.nan-modal-discord {
	height: 2em;
	margin: 0;
	margin-right: 4px;
}
</style>
