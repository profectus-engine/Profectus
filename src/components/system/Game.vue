<template>
    <div class="tabs-container">
        <div v-for="(tab, index) in tabs" :key="index" class="tab" :ref="`tab-${index}`">
            <Nav v-if="index === 0 && !useHeader" />
            <div class="inner-tab">
                <Layer
                    v-if="layerKeys.includes(tab)"
                    v-bind="wrapFeature(layers[tab])"
                    :index="index"
                    :tab="() => ($refs[`tab-${index}`] as HTMLElement | undefined)"
                />
                <component :is="tab" :index="index" v-else />
            </div>
            <div class="separator" v-if="index !== tabs.length - 1"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import modInfo from "@/data/modInfo.json";
import { wrapFeature } from "@/features/feature";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { computed, toRef } from "vue";
import Layer from "./Layer.vue";
import Nav from "./Nav.vue";

const tabs = toRef(player, "tabs");
const layerKeys = computed(() => Object.keys(layers));
const useHeader = modInfo.useHeader;
</script>

<style scoped>
.tabs-container {
    width: 100vw;
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
}

.tab {
    position: relative;
    height: 100%;
    flex-grow: 1;
    transition-duration: 0s;
    overflow-y: auto;
    overflow-x: hidden;
}

.inner-tab {
    padding: 50px 10px;
    min-height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    margin: 0;
    flex-grow: 1;
}

.separator {
    position: absolute;
    right: -3px;
    top: 0;
    bottom: 0;
    width: 6px;
    background: var(--outline);
    z-index: 1;
}
</style>

<style>
.tab hr {
    height: 4px;
    border: none;
    background: var(--outline);
    margin: 7px -10px;
}

.tab .modal-body hr {
    margin: 7px 0;
}
</style>
