<template>
    <Modal :show="show">
        <template v-slot:header>
            <div class="game-over-modal-header">
                <img class="game-over-modal-logo" v-if="logo" :src="logo" :alt="modInfo" />
                <div class="game-over-modal-title">
                    <h2>Congratulations!</h2>
                    <h4>You've beaten {{ title }} v{{ versionNumber }}: {{ versionTitle }}</h4>
                </div>
            </div>
        </template>
        <template v-slot:body="{ shown }">
            <div v-if="shown">
                <div>It took you {{ timePlayed }} to beat the game.</div>
                <br />
                <div>
                    Please check the Discord to discuss the game or to check for new content
                    updates!
                </div>
                <br />
                <div>
                    <a :href="discordLink">
                        <img src="images/discord.png" class="game-over-modal-discord" />
                        {{ discordName }}
                    </a>
                </div>
            </div>
        </template>
        <template v-slot:footer>
            <div class="game-over-footer">
                <button @click="keepGoing" class="button">Keep Going</button>
                <button @click="playAgain" class="button danger">Play Again</button>
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import { hasWon } from "@/data/mod";
import modInfo from "@/data/modInfo.json";
import player from "@/game/player";
import { formatTime } from "@/util/bignum";
import { defineComponent } from "vue";

export default defineComponent({
    name: "GameOverScreen",
    data() {
        const { title, logo, discordName, discordLink, versionNumber, versionTitle } = modInfo;
        return {
            title,
            logo,
            discordName,
            discordLink,
            versionNumber,
            versionTitle
        };
    },
    computed: {
        timePlayed() {
            return formatTime(player.timePlayed);
        },
        show() {
            return hasWon.value && !player.keepGoing;
        }
    },
    methods: {
        keepGoing() {
            player.keepGoing = true;
        },
        playAgain() {
            console.warn("Not yet implemented!");
        }
    }
});
</script>

<style scoped>
.game-over-modal-header {
    margin: -20px;
    margin-bottom: 0;
    background: var(--secondary-background);
}

.game-over-modal-header * {
    margin: 0;
}

.game-over-modal-logo {
    height: 4em;
    width: 4em;
}

.game-over-modal-title {
    padding: 10px 0;
    margin-left: 10px;
}

.game-over-footer {
    display: flex;
    justify-content: flex-end;
}

.game-over-footer button {
    margin: 0 10px;
}

.game-over-modal-discord-link {
    display: flex;
    align-items: center;
}

.game-over-modal-discord {
    height: 2em;
    margin: 0;
    margin-right: 4px;
}
</style>
