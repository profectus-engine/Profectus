<template>
    <div v-if="appErrors.length > 0" class="error-container" :style="theme"><Error :errors="appErrors" /></div>
    <template v-else>
        <div id="modal-root" :style="theme" />
        <div class="app" :style="theme" :class="{ useHeader }">
            <Nav v-if="useHeader" />
            <Game />
            <TPS v-if="unref(showTPS)" />
            <GameOverScreen />
            <NaNScreen />
            <component :is="gameComponent" />
        </div>
    </template>
</template>

<script setup lang="tsx">
import "@fontsource/roboto-mono";
import Error from "components/Error.vue";
import { jsx } from "features/feature";
import state from "game/state";
import { coerceComponent, render } from "util/vue";
import { CSSProperties, watch } from "vue";
import { computed, toRef, unref } from "vue";
import Game from "./components/Game.vue";
import GameOverScreen from "./components/GameOverScreen.vue";
import NaNScreen from "./components/NaNScreen.vue";
import Nav from "./components/Nav.vue";
import TPS from "./components/TPS.vue";
import projInfo from "./data/projInfo.json";
import themes from "./data/themes";
import settings, { gameComponents } from "./game/settings";
import "./main.css";

const useHeader = projInfo.useHeader;
const theme = computed(() => themes[settings.theme].variables as CSSProperties);
const showTPS = toRef(settings, "showTPS");
const appErrors = toRef(state, "errors");

const gameComponent = computed(() => {
    return coerceComponent(jsx(() => (<>{gameComponents.map(render)}</>)));
});
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
    color: var(--foreground);
}

.error-container {
    background: var(--background);
    overflow: auto;
    width: 100%;
    height: 100%;
}

.error-container > .error {
    position: static;
}
</style>
