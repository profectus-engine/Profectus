<template>
    <div id="modal-root" :style="theme" />
    <div class="app" @mousemove="updateMouse" :style="theme" :class="{ useHeader }">
        <Nav v-if="useHeader" />
        <Game />
        <TPS v-if="unref(showTPS)" />
        <GameOverScreen />
        <NaNScreen />
    </div>
</template>

<script setup lang="ts">
import { computed, toRef, unref } from "vue";
import Game from "./components/Game.vue";
import GameOverScreen from "./components/GameOverScreen.vue";
import NaNScreen from "./components/NaNScreen.vue";
import Nav from "./components/Nav.vue";
import TPS from "./components/TPS.vue";
import projInfo from "./data/projInfo.json";
import themes from "./data/themes";
import settings from "./game/settings";
import "./main.css";

function updateMouse(/* event */) {
    // TODO use event to update mouse position for particles
}

const useHeader = projInfo.useHeader;
const theme = computed(() => themes[settings.theme].variables);
const showTPS = toRef(settings, "showTPS");
</script>

<style scoped>
.app {
    background-color: var(--background);
    color: var(--foreground);
    display: flex;
    flex-flow: column;
    min-height: 100%;
    height: 100%;
}

#modal-root {
    position: absolute;
    min-height: 100%;
    height: 100%;
}
</style>
