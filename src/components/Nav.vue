<template>
    <div class="nav" v-if="useHeader" v-bind="$attrs">
        <img v-if="banner" :src="banner" class="banner" :alt="title" />
        <div v-else class="title">{{ title }}</div>
        <div @click="changelog?.open()" class="version-container">
            <Tooltip display="Changelog" :direction="Direction.Down" class="version"
                ><span>v{{ versionNumber }}</span></Tooltip
            >
        </div>
        <div style="flex-grow: 1; cursor: unset"></div>
        <div class="discord">
            <span @click="openDiscord" class="material-icons">discord</span>
            <ul class="discord-links">
                <li v-if="discordLink">
                    <a :href="discordLink" target="_blank">{{ discordName }}</a>
                </li>
                <li>
                    <a href="https://discord.gg/yJ4fjnjU54" target="_blank">Profectus & Friends</a>
                </li>
                <li>
                    <a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a>
                </li>
            </ul>
        </div>
        <div>
            <a href="https://forums.moddingtree.com/" target="_blank">
                <Tooltip display="Forums" :direction="Direction.Down" yoffset="5px">
                    <span class="material-icons">forum</span>
                </Tooltip>
            </a>
        </div>
        <div @click="info?.open()">
            <Tooltip display="Info" :direction="Direction.Down" class="info">
                <span class="material-icons">info</span>
            </Tooltip>
        </div>
        <div @click="savesManager?.open()">
            <Tooltip display="Saves" :direction="Direction.Down" xoffset="-20px">
                <span class="material-icons" :class="{ needsSync }">library_books</span>
            </Tooltip>
        </div>
        <div @click="options?.open()">
            <Tooltip display="Settings" :direction="Direction.Down" xoffset="-66px">
                <span class="material-icons">settings</span>
            </Tooltip>
        </div>
    </div>
    <div v-else class="overlay-nav" v-bind="$attrs">
        <div @click="changelog?.open()" class="version-container">
            <Tooltip display="Changelog" :direction="Direction.Right" xoffset="25%" class="version">
                <span>v{{ versionNumber }}</span>
            </Tooltip>
        </div>
        <div @click="savesManager?.open()">
            <Tooltip display="Saves" :direction="Direction.Right">
                <span class="material-icons" :class="{ needsSync }">library_books</span>
            </Tooltip>
        </div>
        <div @click="options?.open()">
            <Tooltip display="Settings" :direction="Direction.Right">
                <span class="material-icons">settings</span>
            </Tooltip>
        </div>
        <div @click="info?.open()">
            <Tooltip display="Info" :direction="Direction.Right">
                <span class="material-icons">info</span>
            </Tooltip>
        </div>
        <div>
            <a href="https://forums.moddingtree.com/" target="_blank">
                <Tooltip display="Forums" :direction="Direction.Right" xoffset="7px">
                    <span class="material-icons">forum</span>
                </Tooltip>
            </a>
        </div>
        <div class="discord">
            <span @click="openDiscord" class="material-icons">discord</span>
            <ul class="discord-links">
                <li v-if="discordLink">
                    <a :href="discordLink" target="_blank">{{ discordName }}</a>
                </li>
                <li>
                    <a href="https://discord.gg/yJ4fjnjU54" target="_blank">Profectus & Friends</a>
                </li>
                <li>
                    <a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a>
                </li>
            </ul>
        </div>
    </div>
    <Info ref="info" @open-changelog="changelog?.open()" />
    <SavesManager ref="savesManager" />
    <Options ref="options" />
    <Changelog ref="changelog" />
</template>

<script setup lang="ts">
import Changelog from "data/Changelog.vue";
import projInfo from "data/projInfo.json";
import settings from "game/settings";
import { Direction } from "util/common";
import { galaxy, syncedSaves } from "util/galaxy";
import { computed, ref } from "vue";
import Tooltip from "wrappers/tooltips/Tooltip.vue";
import Info from "./modals/Info.vue";
import Options from "./modals/Options.vue";
import SavesManager from "./modals/SavesManager.vue";

const info = ref<typeof Info | null>(null);
const savesManager = ref<typeof SavesManager | null>(null);
const options = ref<typeof Options | null>(null);
const changelog = ref<typeof Changelog | null>(null);

const { useHeader, banner, title, discordName, discordLink, versionNumber } = projInfo;

function openDiscord() {
    window.open(discordLink, "mywindow");
}

const needsSync = computed(
    () => galaxy.value?.loggedIn === true && !syncedSaves.value.includes(settings.active)
);
</script>

<style scoped>
.nav {
    background-color: var(--raised-background);
    display: flex;
    left: 0;
    right: 0;
    top: 0;
    height: 46px;
    width: 100%;
    border-bottom: 4px solid var(--outline);
}

.nav > * {
    height: 46px;
    width: 46px;
    display: flex;
    cursor: pointer;
    flex-shrink: 0;
}

.nav > .banner {
    height: 100%;
    width: unset;
}

.overlay-nav {
    position: fixed;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    z-index: 2;
}

.overlay-nav > * {
    height: 50px;
    width: 50px;
    display: flex;
    cursor: pointer;
    margin: 0;
    align-items: center;
    justify-content: center;
}

.title {
    font-size: 36px;
    text-align: left;
    margin-left: 12px;
    cursor: unset;
}

.nav > .title {
    width: unset;
    flex-shrink: 1;
    overflow: hidden;
    white-space: nowrap;
}

.nav .saves,
.nav .info {
    display: flex;
}

.tooltip-container {
    width: 100%;
    height: 100%;
    display: flex;
}

.overlay-nav .discord {
    position: relative;
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
    transition: right 0.25s ease;
    background: var(--raised-background);
    z-index: 10;
}

.overlay-nav .discord-links {
    position: absolute;
    left: -280px;
    right: unset;
    transition: left 0.25s ease;
}

.overlay-nav .discord:hover .discord-links {
    left: -10px;
}

.discord-links li {
    margin-bottom: 4px;
}

.discord-links li:first-child {
    font-size: 1.2em;
}

*:not(.overlay-nav) .discord:hover .discord-links {
    right: 0;
}

.material-icons {
    font-size: 36px;
}

.material-icons:hover {
    text-shadow: 5px 0 10px var(--link), -3px 0 12px var(--foreground);
}

.nav .version-container {
    display: flex;
    height: 25px;
    margin-bottom: 0;
    margin-left: 10px;
}

.overlay-nav .version-container {
    width: unset;
    height: 25px;
}

.version {
    color: var(--points);
}

.version:hover span {
    text-shadow: 5px 0 10px var(--points), -3px 0 12px var(--points);
}

.nav > div > a,
.overlay-nav > div > a {
    color: var(--foreground);
    text-shadow: none;
}

.needsSync {
    color: var(--danger);
    animation: 4s wiggle ease infinite;
}

@keyframes wiggle {
    0% {
        transform: rotate(-3deg);
        box-shadow: 0 2px 2px #0003;
    }
    5% {
        transform: rotate(20deg);
    }
    10% {
        transform: rotate(-15deg);
    }
    15% {
        transform: rotate(5deg);
    }
    20% {
        transform: rotate(-1deg);
    }
    25% {
        transform: rotate(0);
        box-shadow: 0 2px 2px #0003;
    }
}
</style>
