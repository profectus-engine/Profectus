<template>
    <Modal :show="show" @close="$emit('closeDialog', 'Options')">
        <template v-slot:header>
            <div class="header">
                <h2>Options</h2>
            </div>
        </template>
        <template v-slot:body>
            <Select
                title="Theme"
                :options="themes"
                :value="theme"
                @change="setTheme"
                default="classic"
            />
            <Select
                title="Show Milestones"
                :options="msDisplayOptions"
                :value="msDisplay"
                @change="setMSDisplay"
                default="all"
            />
            <Toggle title="Show TPS" :value="showTPS" @change="toggleSettingsOption('showTPS')" />
            <Toggle
                title="Hide Maxed Challenges"
                :value="hideChallenges"
                @change="toggleSettingsOption('hideChallenges')"
            />
            <Toggle
                title="Unthrottled"
                :value="unthrottled"
                @change="toggleSettingsOption('unthrottled')"
            />
            <Toggle
                title="Offline Production<tooltip display='Save-specific'>*</tooltip>"
                :value="offlineProd"
                @change="togglePlayerOption('offlineProd')"
            />
            <Toggle
                title="Autosave<tooltip display='Save-specific'>*</tooltip>"
                :value="autosave"
                @change="togglePlayerOption('autosave')"
            />
            <Toggle
                title="Pause game<tooltip display='Save-specific'>*</tooltip>"
                :value="paused"
                @change="togglePaused"
            />
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import themes, { Themes } from "@/data/themes";
import { camelToTitle } from "@/util/common";
import { mapPlayer, mapSettings } from "@/util/vue";
import player from "@/game/player";
import { MilestoneDisplay } from "@/game/enums";
import { PlayerData } from "@/typings/player";
import settings from "@/game/settings";
import { Settings } from "@/typings/settings";

export default defineComponent({
    name: "Options",
    props: {
        show: Boolean
    },
    emits: ["closeDialog"],
    data() {
        return {
            themes: Object.keys(themes).map(theme => ({
                label: camelToTitle(theme),
                value: theme
            })),
            msDisplayOptions: Object.values(MilestoneDisplay).map(option => ({
                label: camelToTitle(option),
                value: option
            }))
        };
    },
    computed: {
        ...mapSettings(["showTPS", "hideChallenges", "theme", "msDisplay", "unthrottled"]),
        ...mapPlayer(["autosave", "offlineProd"]),
        paused() {
            return player.devSpeed === 0;
        }
    },
    methods: {
        togglePlayerOption(option: keyof PlayerData) {
            player[option] = !player[option];
        },
        toggleSettingsOption(option: keyof Settings) {
            settings[option] = !settings[option];
        },
        setTheme(theme: Themes) {
            settings.theme = theme;
        },
        setMSDisplay(msDisplay: MilestoneDisplay) {
            settings.msDisplay = msDisplay;
        },
        togglePaused() {
            player.devSpeed = this.paused ? 1 : 0;
        }
    }
});
</script>

<style scoped>
.header {
    margin-bottom: -10px;
}

*:deep() .tooltip-container {
    display: inline;
    margin-left: 5px;
}
</style>
