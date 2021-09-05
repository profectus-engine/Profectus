<template>
    <div id="modal-root" :style="theme" />
    <div class="app" @mousemove="updateMouse" :style="theme" :class="{ useHeader }">
        <Nav v-if="useHeader" />
        <Tabs />
        <TPS v-if="showTPS" />
        <GameOverScreen />
        <NaNScreen />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import modInfo from "./data/modInfo.json";
import themes from "./data/themes";
import settings from "./game/settings";
import "./main.css";
import { mapSettings } from "./util/vue";

export default defineComponent({
    name: "App",
    data() {
        return { useHeader: modInfo.useHeader };
    },
    computed: {
        ...mapSettings(["showTPS"]),
        theme() {
            return themes[settings.theme].variables;
        }
    },
    methods: {
        updateMouse(/* event */) {
            // TODO use event to update mouse position for particles
        }
    }
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
}
</style>
