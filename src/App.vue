<template>
    <div v-if="appErrors.length > 0" class="error-container" :style="theme">
        <Error :errors="appErrors" />
    </div>
    <template v-else>
        <div id="modal-root" :style="theme" />
        <div class="app" :style="theme" :class="{ useHeader }">
            <Nav v-if="useHeader" />
            <Game />
            <TPS v-if="unref(showTPS)" />
            <AddictionWarning />
            <GameOverScreen />
            <NaNScreen />
            <CloudSaveResolver />
            <GameComponent />
        </div>
    </template>
</template>

<script setup lang="tsx">
import "@fontsource/roboto-mono";
import Error from "components/Error.vue";
import AddictionWarning from "components/modals/AddictionWarning.vue";
import CloudSaveResolver from "components/modals/CloudSaveResolver.vue";
import GameOverScreen from "components/modals/GameOverScreen.vue";
import NaNScreen from "components/modals/NaNScreen.vue";
import state from "game/state";
import { render } from "util/vue";
import type { CSSProperties } from "vue";
import { computed, toRef, unref } from "vue";
import Game from "./components/Game.vue";
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

const GameComponent = () => gameComponents.map(c => render(c));
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
