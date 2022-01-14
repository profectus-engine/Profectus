<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <div class="header">
                <h2>Options</h2>
            </div>
        </template>
        <template v-slot:body>
            <Select title="Theme" :options="themes" v-model="theme" />
            <Select title="Show Milestones" :options="msDisplayOptions" v-model="msDisplay" />
            <Toggle title="Show TPS" v-model="showTPS" />
            <Toggle title="Hide Maxed Challenges" v-model="hideChallenges" />
            <Toggle title="Unthrottled" v-model="unthrottled" />
            <Toggle
                title="Offline Production<tooltip display='Save-specific'>*</tooltip>"
                v-model="offlineProd"
            />
            <Toggle
                title="Autosave<tooltip display='Save-specific'>*</tooltip>"
                v-model="autosave"
            />
            <Toggle
                title="Pause game<tooltip display='Save-specific'>*</tooltip>"
                v-model="isPaused"
            />
        </template>
    </Modal>
</template>

<script setup lang="ts">
import Modal from "@/components/system/Modal.vue";
import rawThemes from "@/data/themes";
import { MilestoneDisplay } from "@/features/milestone";
import player from "@/game/player";
import settings from "@/game/settings";
import { camelToTitle } from "@/util/common";
import { computed, ref, toRefs } from "vue";
import Toggle from "../fields/Toggle.vue";
import Select from "../fields/Select.vue";

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

// TODO allow features to register options
const msDisplayOptions = Object.values(MilestoneDisplay).map(option => ({
    label: camelToTitle(option),
    value: option
}));

const { showTPS, hideChallenges, theme, msDisplay, unthrottled } = toRefs(settings);
const { autosave, offlineProd, devSpeed } = toRefs(player);
const isPaused = computed({
    get() {
        return devSpeed.value === 0;
    },
    set(value: boolean) {
        devSpeed.value = value ? null : 0;
    }
});
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
