<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <div class="info-modal-header">
                <img class="info-modal-logo" v-if="logo" :src="logo" :alt="title" />
                <div class="info-modal-title">
                    <h2>{{ title }}</h2>
                    <h4>
                        v{{ versionNumber }}<span v-if="versionTitle">: {{ versionTitle }}</span>
                    </h4>
                </div>
            </div>
        </template>
        <template v-slot:body="{ shown }">
            <div v-if="shown">
                <div v-if="author">By {{ author }}</div>
                <div>
                    Made in Profectus, by thepaperpilot with inspiration from Acameada and Jacorb
                </div>
                <br />
                <div class="link" @click="emits('openChangelog')">Changelog</div>
                <br />
                <div>
                    <a
                        :href="discordLink"
                        v-if="discordLink"
                        class="info-modal-discord-link"
                        target="_blank"
                    >
                        <span class="material-icons info-modal-discord">discord</span>
                        {{ discordName }}
                    </a>
                </div>
                <div>
                    <a
                        href="https://discord.gg/yJ4fjnjU54"
                        class="info-modal-discord-link"
                        target="_blank"
                    >
                        <span class="material-icons info-modal-discord">discord</span>
                        Profectus & Friends
                    </a>
                </div>
                <div>
                    <a
                        href="https://discord.gg/F3xveHV"
                        class="info-modal-discord-link"
                        target="_blank"
                    >
                        <span class="material-icons info-modal-discord">discord</span>
                        The Modding Tree
                    </a>
                </div>
                <br />
                <div>Time Played: {{ timePlayed }}</div>
                <InfoComponents />
            </div>
        </template>
    </Modal>
</template>

<script setup lang="tsx">
import projInfo from "data/projInfo.json";
import player from "game/player";
import { infoComponents } from "game/settings";
import { formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, ref } from "vue";
import Modal from "./Modal.vue";

const { title, logo, author, discordName, discordLink, versionNumber, versionTitle } = projInfo;

const emits = defineEmits<{
    (e: "openChangelog"): void;
}>();

const isOpen = ref(false);

const timePlayed = computed(() => formatTime(player.timePlayed));

const InfoComponents = () => infoComponents.map(f => render(f));

defineExpose({
    open() {
        isOpen.value = true;
    }
});
</script>

<style scoped>
.info-modal-header {
    display: flex;
    margin: -20px;
    margin-bottom: 0;
    background: var(--raised-background);
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
    margin: 0;
    margin-right: 4px;
}
</style>
