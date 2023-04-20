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
                    <a href="https://discord.gg/yJ4fjnjU54" target="_blank"
                        >The Paper Pilot Community</a
                    >
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
                <span class="material-icons">library_books</span>
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
                <span class="material-icons">library_books</span>
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
                    <a href="https://discord.gg/yJ4fjnjU54" target="_blank"
                        >The Paper Pilot Community</a
                    >
                </li>
                <li>
                    <a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a>
                </li>
            </ul>
        </div>
    </div>
    <Info ref="info" :changelog="changelog" />
    <SavesManager ref="savesManager" />
    <Options ref="options" />
    <Changelog ref="changelog" />
</template>

<script setup lang="ts">
import Changelog from "data/Changelog.vue";
import projInfo from "data/projInfo.json";
import Tooltip from "features/tooltips/Tooltip.vue";
import { Direction } from "util/common";
import type { ComponentPublicInstance } from "vue";
import { ref } from "vue";
import Info from "./Info.vue";
import Options from "./Options.vue";
import SavesManager from "./SavesManager.vue";

const info = ref<ComponentPublicInstance<typeof Info> | null>(null);
const savesManager = ref<ComponentPublicInstance<typeof SavesManager> | null>(null);
const options = ref<ComponentPublicInstance<typeof Options> | null>(null);
// For some reason Info won't accept the changelog unless I do this:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changelog = ref<ComponentPublicInstance<any> | null>(null);

const { useHeader, banner, title, discordName, discordLink, versionNumber } = projInfo;

function openDiscord() {
    window.open(discordLink, "mywindow");
}
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
</style>
