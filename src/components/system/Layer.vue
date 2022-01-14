<template>
    <div class="layer-container">
        <button v-if="showGoBack" class="goBack" @click="goBack">
            ←
        </button>
        <button class="layer-tab minimized" v-if="minimized" @click="minimized = false">
            <div>{{ name }}</div>
        </button>
        <div class="layer-tab" :style="style" :class="classes" v-else>
            <Links v-if="links" :links="links">
                <component :is="component" />
            </Links>
            <component v-else :is="component" />
        </div>
        <button v-if="minimizable" class="minimize" @click="minimized = true">
            ▼
        </button>
    </div>
</template>

<script setup lang="ts">
import Links from "@/components/system/Links.vue";
import { FeatureComponent } from "@/features/feature";
import { GenericLayer } from "@/game/layers";
import { coerceComponent } from "@/util/vue";
import { computed, nextTick, toRefs, unref, watch } from "vue";
import modInfo from "@/data/modInfo.json";
import player from "@/game/player";

const props = toRefs(
    defineProps<
        FeatureComponent<GenericLayer> & {
            index: number;
            tab: () => HTMLElement | undefined;
        }
    >()
);

const component = computed(() => coerceComponent(unref(props.display)));
const showGoBack = computed(
    () => modInfo.allowGoBack && unref(props.index) > 0 && !props.minimized.value
);

function goBack() {
    player.tabs = player.tabs.slice(0, unref(props.index));
}

nextTick(() => updateTab(props.minimized.value, props.minWidth.value));
watch([props.minimized, props.minWidth], ([minimized, minWidth]) => updateTab(minimized, minWidth));

function updateTab(minimized: boolean, minWidth: number) {
    const tabValue = props.tab.value();
    if (tabValue != undefined) {
        if (minimized) {
            tabValue.style.flexGrow = "0";
            tabValue.style.flexShrink = "0";
            tabValue.style.width = "60px";
            tabValue.style.minWidth = tabValue.style.flexBasis = "";
            tabValue.style.margin = "0";
        } else {
            tabValue.style.flexGrow = "";
            tabValue.style.flexShrink = "";
            tabValue.style.width = "";
            tabValue.style.minWidth = tabValue.style.flexBasis = `${minWidth}px`;
            tabValue.style.margin = "";
        }
    }
}
</script>

<style scoped>
.layer-container {
    min-width: 100%;
    min-height: 100%;
    margin: 0;
    flex-grow: 1;
    display: flex;
    isolation: isolate;
}

.layer-tab:not(.minimized) {
    padding-top: 20px;
    padding-bottom: 20px;
    min-height: 100%;
    flex-grow: 1;
    text-align: center;
    position: relative;
}

.inner-tab > .layer-container > .layer-tab:not(.minimized) {
    padding-top: 50px;
}

.layer-tab.minimized {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding: 0;
    padding-top: 55px;
    margin: 0;
    cursor: pointer;
    font-size: 40px;
    color: var(--foreground);
    border: none;
    background-color: transparent;
}

.layer-tab.minimized div {
    margin: 0;
    writing-mode: vertical-rl;
    padding-left: 10px;
    width: 50px;
}

.inner-tab > .layer-container > .layer-tab:not(.minimized) {
    margin: -50px -10px;
    padding: 50px 10px;
}

.modal-body .layer-tab {
    padding-bottom: 0;
}

.modal-body .layer-tab:not(.hasSubtabs) {
    padding-top: 0;
}

.minimize {
    position: sticky;
    top: 6px;
    right: 9px;
    z-index: 7;
    line-height: 30px;
    width: 30px;
    border: none;
    background: var(--background);
    box-shadow: var(--background) 0 2px 3px 5px;
    border-radius: 50%;
    color: var(--foreground);
    font-size: 40px;
    cursor: pointer;
    padding: 0;
    margin-top: -44px;
    margin-right: -30px;
}

.minimized + .minimize {
    transform: rotate(-90deg);
    top: 10px;
    right: 18px;
}

.goBack {
    position: absolute;
    top: 0;
    left: 20px;
    background-color: transparent;
    border: 1px solid transparent;
    color: var(--foreground);
    font-size: 40px;
    cursor: pointer;
    line-height: 40px;
    z-index: 7;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--foreground);
}
</style>
