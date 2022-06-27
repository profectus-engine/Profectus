<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <div class="header">
                <h2>Options</h2>
            </div>
        </template>
        <template v-slot:body>
            <Select title="Theme" :options="themes" v-model="theme" />
            <component :is="settingFieldsComponent" />
            <Toggle title="Show TPS" v-model="showTPS" />
            <hr />
            <Toggle title="Unthrottled" v-model="unthrottled" />
            <Toggle :title="offlineProdTitle" v-model="offlineProd" />
            <Toggle :title="autosaveTitle" v-model="autosave" />
            <Toggle v-if="projInfo.enablePausing" :title="isPausedTitle" v-model="isPaused" />
        </template>
    </Modal>
</template>

<script setup lang="tsx">
import Modal from "components/Modal.vue";
import projInfo from "data/projInfo.json";
import rawThemes from "data/themes";
import { jsx } from "features/feature";
import Tooltip from "features/tooltips/Tooltip.vue";
import player from "game/player";
import settings, { settingFields } from "game/settings";
import { camelToTitle } from "util/common";
import { coerceComponent, render } from "util/vue";
import { computed, ref, toRefs } from "vue";
import Select from "./fields/Select.vue";
import Toggle from "./fields/Toggle.vue";

const isOpen = ref(false);

defineExpose({
    open() {
        isOpen.value = true;
    }
});

const themes = Object.keys(rawThemes).map(theme => ({
    label: camelToTitle(theme),
    value: theme
}));

const settingFieldsComponent = computed(() => {
    return coerceComponent(jsx(() => <>{settingFields.map(render)}</>));
});

const { showTPS, theme, unthrottled } = toRefs(settings);
const { autosave, offlineProd } = toRefs(player);
const isPaused = computed({
    get() {
        return player.devSpeed === 0;
    },
    set(value: boolean) {
        player.devSpeed = value ? 0 : null;
    }
});

const offlineProdTitle = jsx(() => (
    <span>
        Offline Production<Tooltip display="Save-specific">*</Tooltip>
    </span>
));
const autosaveTitle = jsx(() => (
    <span>
        Autosave<Tooltip display="Save-specific">*</Tooltip>
    </span>
));
const isPausedTitle = jsx(() => (
    <span>
        Pause game<Tooltip display="Save-specific">*</Tooltip>
    </span>
));
</script>

<style scoped>
.header {
    margin-bottom: -10px;
}

*:deep() .tooltip-container {
    display: inline;
    margin-left: 5px;
}
</style>
