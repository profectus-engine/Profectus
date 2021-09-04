<template>
    <div class="nav" v-if="useHeader" v-bind="$attrs">
        <img v-if="banner" :src="banner" height="100%" :alt="title" />
        <div v-else class="title">{{ title }}</div>
        <div
            @click="openDialog('Changelog')"
            class="version-container"
            style="pointer-events: none"
        >
            <tooltip display="Changelog" bottom class="version"
                ><span>v{{ version }}</span></tooltip
            >
        </div>
        <div style="flex-grow: 1; cursor: unset;"></div>
        <div class="discord">
            <img src="images/discord.png" @click="openDiscord" />
            <ul class="discord-links">
                <li v-if="discordLink !== 'https://discord.gg/WzejVAx'">
                    <a :href="discordLink" target="_blank">{{ discordName }}</a>
                </li>
                <li>
                    <a href="https://discord.gg/WzejVAx" target="_blank"
                        >The Paper Pilot Community</a
                    >
                </li>
                <li>
                    <a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a>
                </li>
                <li>
                    <a href="http://discord.gg/wwQfgPa" target="_blank">Jacorb's Games</a>
                </li>
            </ul>
        </div>
        <div @click="openDialog('Info')">
            <tooltip display="<span>Info</span>" bottom class="info"><span>i</span></tooltip>
        </div>
        <div @click="openDialog('Saves')">
            <tooltip display="Saves" bottom class="saves" xoffset="-20px">
                <span class="material-icons">library_books</span>
            </tooltip>
        </div>
        <div @click="openDialog('Options')">
            <tooltip display="<span>Options</span>" bottom class="options" xoffset="-70px">
                <img src="images/options_wheel.png" />
            </tooltip>
        </div>
    </div>
    <div v-else class="overlay-nav" v-bind="$attrs">
        <div @click="openDialog('Changelog')" class="version-container">
            <tooltip display="Changelog" right xoffset="25%" class="version"
                ><span>v{{ version }}</span></tooltip
            >
        </div>
        <div @click="openDialog('Saves')">
            <tooltip display="Saves" right class="saves"
                ><span class="material-icons">library_books</span></tooltip
            >
        </div>
        <div @click="openDialog('Options')">
            <tooltip display="<span>Options</span>" right class="options"
                ><img src="images/options_wheel.png"
            /></tooltip>
        </div>
        <div @click="openDialog('Info')">
            <tooltip display="<span>Info</span>" right class="info"><span>i</span></tooltip>
        </div>
        <div class="discord">
            <img src="images/discord.png" @click="openDiscord" />
            <ul class="discord-links">
                <li v-if="discordLink !== 'https://discord.gg/WzejVAx'">
                    <a :href="discordLink" target="_blank">{{ discordName }}</a>
                </li>
                <li>
                    <a href="https://discord.gg/WzejVAx" target="_blank"
                        >The Paper Pilot Community</a
                    >
                </li>
                <li>
                    <a href="https://discord.gg/F3xveHV" target="_blank">The Modding Tree</a>
                </li>
                <li>
                    <a href="http://discord.gg/wwQfgPa" target="_blank">Jacorb's Games</a>
                </li>
            </ul>
        </div>
    </div>
    <Info :show="showInfo" @openDialog="openDialog" @closeDialog="closeDialog" />
    <SavesManager :show="showSaves" @closeDialog="closeDialog" />
    <Options :show="showOptions" @closeDialog="closeDialog" />
</template>

<script lang="ts">
import modInfo from "@/data/modInfo.json";
import { defineComponent } from "vue";

type modals = "Info" | "Saves" | "Options" | "Changelog";
type showModals = "showInfo" | "showSaves" | "showOptions" | "showChangelog";

export default defineComponent({
    name: "Nav",
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
        };
    },
    methods: {
        openDiscord() {
            window.open(this.discordLink, "mywindow");
        },
        openDialog(dialog: modals) {
            this[`show${dialog}` as showModals] = true;
        },
        closeDialog(dialog: modals) {
            this[`show${dialog}` as showModals] = false;
        }
    }
});
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

.nav > * {
    height: 46px;
    width: 46px;
    display: flex;
    cursor: pointer;
    flex-shrink: 0;
}

.overlay-nav {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    z-index: 1;
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
    background: var(--secondary-background);
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

.info {
    font-size: 30px;
    color: var(--link);
    line-height: 14px;
}

.info:hover span {
    transform: scale(1.2, 1.2);
    text-shadow: 5px 0 10px var(--link), -3px 0 12px var(--link);
}

.saves span {
    font-size: 36px;
}

.saves:hover span {
    transform: scale(1.2, 1.2);
    text-shadow: 5px 0 10px var(--color), -3px 0 12px var(--color);
}

.options img {
    width: 100%;
    height: 100%;
}

.options:hover img {
    transform: rotate(360deg);
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
    transform-origin: 0% 50%;
    transform: scale(1.2, 1.2);
    text-shadow: 5px 0 10px var(--points), -3px 0 12px var(--points);
}
</style>
