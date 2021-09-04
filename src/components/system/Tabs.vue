<template>
    <div class="tabs-container">
        <div v-for="(tab, index) in tabs" :key="index" class="tab" :ref="`tab-${index}`">
            <Nav v-if="index === 0 && !useHeader" />
            <div class="inner-tab">
                <LayerProvider
                    :layer="tab"
                    :index="index"
                    v-if="tab in components && components[tab]"
                >
                    <component :is="components[tab]" />
                </LayerProvider>
                <layer-tab
                    :layer="tab"
                    :index="index"
                    v-else-if="tab in components"
                    :minimizable="minimizable[tab]"
                    :tab="() => $refs[`tab-${index}`]"
                />
                <component :is="tab" :index="index" v-else />
            </div>
            <div class="separator" v-if="index !== tabs.length - 1"></div>
        </div>
    </div>
</template>

<script lang="ts">
import modInfo from "@/data/modInfo.json";
import { layers } from "@/game/layers";
import { coerceComponent, mapState } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "Tabs",
    data() {
        return { useHeader: modInfo.useHeader };
    },
    computed: {
        ...mapState(["tabs"]),
        components() {
            return Object.keys(layers).reduce(
                (acc: Record<string, Component | string | false>, curr) => {
                    acc[curr] =
                        (layers[curr].component && coerceComponent(layers[curr].component!)) ||
                        false;
                    return acc;
                },
                {}
            );
        },
        minimizable() {
            return Object.keys(layers).reduce((acc: Record<string, boolean>, curr) => {
                acc[curr] = layers[curr].minimizable !== false;
                return acc;
            }, {});
        }
    }
});
</script>

<style scoped>
.tabs-container {
    width: 100vw;
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
}

.tabs {
    display: flex;
    height: 100%;
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
    background: var(--separator);
    z-index: 1;
}
</style>

<style>
.tab hr {
    height: 4px;
    border: none;
    background: var(--separator);
    margin: 7px -10px;
}

.tab .modal-body hr {
    margin: 7px 0;
}
</style>
