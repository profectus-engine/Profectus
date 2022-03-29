<template>
    <div class="tabs-container" :class="{ useHeader }">
        <div v-for="(tab, index) in tabs" :key="index" class="tab" :ref="`tab-${index}`">
            <Nav v-if="index === 0 && !useHeader" />
            <div class="inner-tab">
                <Layer
                    v-if="layerKeys.includes(tab)"
                    v-bind="gatherLayerProps(layers[tab]!)"
                    :index="index"
                    :tab="() => (($refs[`tab-${index}`] as HTMLElement[] | undefined)?.[0])"
                />
                <component :is="tab" :index="index" v-else />
            </div>
            <div class="separator" v-if="index !== tabs.length - 1"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import projInfo from "data/projInfo.json";
import { GenericLayer, layers } from "game/layers";
import player from "game/player";
import { computed, toRef } from "vue";
import Layer from "./Layer.vue";
import Nav from "./Nav.vue";

const tabs = toRef(player, "tabs");
const layerKeys = computed(() => Object.keys(layers));
const useHeader = projInfo.useHeader;

function gatherLayerProps(layer: GenericLayer) {
    const { display, minimized, minWidth, name, color, style, classes, minimizable, nodes } = layer;
    return { display, minimized, minWidth, name, color, style, classes, minimizable, nodes };
}
</script>

<style scoped>
.tabs-container {
    width: 100vw;
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
}

.tabs-container:not(.useHeader) {
    width: calc(100vw - 50px);
    margin-left: 50px;
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
    right: -4px;
    top: 0;
    bottom: 0;
    width: 8px;
    background: var(--outline);
    z-index: 1;
}
</style>

<style>
.tab hr {
    height: 4px;
    border: none;
    background: var(--outline);
    margin: var(--feature-margin) -10px;
}

.tab .modal-body hr {
    margin: 7px 0;
}
</style>
