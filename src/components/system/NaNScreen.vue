<template>
    <Modal :show="hasNaN" v-bind="$attrs">
        <template v-slot:header>
            <div class="nan-modal-header">
                <h2>NaN value detected!</h2>
            </div>
        </template>
        <template v-slot:body>
            <div>
                Attempted to assign "{{ path }}" to NaN (previously {{ format(previous) }}).
                Auto-saving has been {{ autosave ? "enabled" : "disabled" }}. Check the console for
                more details, and consider sharing it with the developers on discord.
            </div>
            <br />
            <div>
                <a :href="discordLink" class="nan-modal-discord-link">
                    <img src="images/discord.png" class="nan-modal-discord" />
                    {{ discordName }}
                </a>
            </div>
            <br />
            <Toggle title="Autosave" :value="autosave" @change="setAutosave" />
            <Toggle title="Pause game" :value="paused" @change="togglePaused" />
        </template>
        <template v-slot:footer>
            <div class="nan-footer">
                <button @click="toggleSavesManager" class="button">
                    Open Saves Manager
                </button>
                <button @click="setZero" class="button">Set to 0</button>
                <button @click="setOne" class="button">Set to 1</button>
                <button
                    @click="setPrev"
                    class="button"
                    v-if="previous && previous.neq(0) && previous.neq(1)"
                >
                    Set to previous
                </button>
                <button @click="ignore" class="button danger">Ignore</button>
            </div>
        </template>
    </Modal>
    <SavesManager :show="showSaves" @closeDialog="toggleSavesManager" />
</template>

<script lang="ts">
import modInfo from "@/data/modInfo.json";
import player from "@/game/player";
import state from "@/game/state";
import Decimal, { format } from "@/util/bignum";
import { mapPlayer, mapState } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "NaNScreen",
    data() {
        const { discordName, discordLink } = modInfo;
        return { discordName, discordLink, format, showSaves: false };
    },
    computed: {
        ...mapPlayer(["autosave"]),
        ...mapState(["hasNaN"]),
        path(): string | undefined {
            return state.NaNPath?.join(".");
        },
        previous(): unknown {
            if (state.NaNReceiver && this.property) {
                return state.NaNReceiver[this.property];
            }
            return null;
        },
        paused() {
            return player.devSpeed === 0;
        },
        property(): string | undefined {
            return state.NaNPath?.slice(-1)[0];
        }
    },
    methods: {
        setZero() {
            if (state.NaNReceiver && this.property) {
                state.NaNReceiver[this.property] = new Decimal(0);
                state.hasNaN = false;
            }
        },
        setOne() {
            if (state.NaNReceiver && this.property) {
                state.NaNReceiver[this.property] = new Decimal(1);
                state.hasNaN = false;
            }
        },
        setPrev() {
            state.hasNaN = false;
        },
        ignore() {
            if (state.NaNReceiver && this.property) {
                state.NaNReceiver[this.property] = new Decimal(NaN);
                state.hasNaN = false;
            }
        },
        setAutosave(autosave: boolean) {
            player.autosave = autosave;
        },
        toggleSavesManager() {
            this.showSaves = !this.showSaves;
        },
        togglePaused() {
            player.devSpeed = this.paused ? 1 : 0;
        }
    }
});
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
