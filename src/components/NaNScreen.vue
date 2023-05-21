<template>
    <Modal v-model="hasNaN" v-bind="$attrs">
        <template v-slot:header>
            <div class="nan-modal-header">
                <h2>NaN value detected!</h2>
            </div>
        </template>
        <template v-slot:body>
            <div>
                Attempted to assign "{{ path }}" to NaN<span v-if="previous">
                    {{ " " }}(previously {{ format(previous) }})</span
                >. Auto-saving has been {{ autosave ? "enabled" : "disabled" }}. Check the console
                for more details, and consider sharing it with the developers on discord.
            </div>
            <br />
            <div>
                <a
                    :href="discordLink || 'https://discord.gg/yJ4fjnjU54'"
                    class="nan-modal-discord-link"
                >
                    <span class="material-icons nan-modal-discord">discord</span>
                    {{ discordName || "Profectus & Friends" }}
                </a>
            </div>
            <br />
            <Toggle title="Autosave" v-model="autosave" />
            <Toggle v-if="projInfo.enablePausing" title="Pause game" v-model="isPaused" />
        </template>
        <template v-slot:footer>
            <div class="nan-footer">
                <button @click="savesManager?.open()" class="button">Open Saves Manager</button>
                <button @click="setZero" class="button">Set to 0</button>
                <button @click="setOne" class="button">Set to 1</button>
                <button
                    @click="hasNaN = false"
                    class="button"
                    v-if="previous && Decimal.neq(previous, 0) && Decimal.neq(previous, 1)"
                >
                    Set to previous
                </button>
                <button @click="ignore" class="button danger">Ignore</button>
            </div>
        </template>
    </Modal>
    <SavesManager ref="savesManager" />
</template>

<script setup lang="ts">
import Modal from "components/Modal.vue";
import projInfo from "data/projInfo.json";
import player from "game/player";
import state from "game/state";
import type { DecimalSource } from "util/bignum";
import Decimal, { format } from "util/bignum";
import type { ComponentPublicInstance } from "vue";
import { computed, ref, toRef, watch } from "vue";
import Toggle from "./fields/Toggle.vue";
import SavesManager from "./SavesManager.vue";

const { discordName, discordLink } = projInfo;
const autosave = ref(true);
const isPaused = ref(true);
const hasNaN = toRef(state, "hasNaN");
const savesManager = ref<ComponentPublicInstance<typeof SavesManager> | null>(null);

watch(hasNaN, hasNaN => {
    if (hasNaN) {
        autosave.value = player.autosave;
        isPaused.value = player.devSpeed === 0;
    } else {
        player.autosave = autosave.value;
        player.devSpeed = isPaused.value ? 0 : null;
    }
});

const path = computed(() => state.NaNPath?.join("."));
const previous = computed<DecimalSource | null>(() => {
    if (state.NaNPersistent != null) {
        return state.NaNPersistent.value;
    }
    return null;
});

function setZero() {
    if (state.NaNPersistent != null) {
        state.NaNPersistent.value = new Decimal(0);
        state.hasNaN = false;
    }
}

function setOne() {
    if (state.NaNPersistent) {
        state.NaNPersistent.value = new Decimal(1);
        state.hasNaN = false;
    }
}

function ignore() {
    if (state.NaNPersistent) {
        state.NaNPersistent.value = new Decimal(NaN);
        state.hasNaN = false;
    }
}
</script>

<style scoped>
.nan-modal-header {
    padding: 10px 0;
    margin-left: 10px;
}

.nan-footer {
    display: flex;
    justify-content: flex-end;
}

.nan-footer button {
    margin: 0 10px;
}

.nan-modal-discord-link {
    display: flex;
    align-items: center;
}

.nan-modal-discord {
    margin: 0;
    margin-right: 4px;
}
</style>
