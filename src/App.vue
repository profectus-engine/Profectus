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
import themes from "./data/themes";
import player from "./game/player";
import modInfo from "./data/modInfo.json";
import { mapState } from "./util/vue";
import "./main.css";

export default defineComponent({
    name: "App",
    data() {
        return { useHeader: modInfo.useHeader };
    },
    computed: {
        ...mapState(["showTPS"]),
        theme() {
            return themes[player.theme].variables;
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
    color: var(--color);
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
