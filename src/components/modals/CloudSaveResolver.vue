<template>
    <Modal v-model="isOpen" width="960px" ref="modal" :prevent-closing="true">
        <template v-slot:header>
            <div class="cloud-saves-modal-header">
                <h2>Cloud {{ pluralizedSave }} loaded!</h2>
            </div>
        </template>
        <template v-slot:body>
            <div>
                Upon loading, your cloud {{ pluralizedSave }}
                {{ conflictingSaves.length > 1 ? "appear" : "appears" }} to be out of sync with your
                local {{ pluralizedSave }}. Which
                {{ pluralizedSave }}
                do you want to keep?
            </div>
            <br />
            <div
                v-for="(conflict, i) in unref(conflictingSaves)"
                :key="conflict.id"
                class="conflict-container"
            >
                <div @click="selectCloud(i)" :class="{ selected: selectedSaves[i] === 'cloud' }">
                    <h2>
                        Cloud
                        <span
                            v-if="(conflict.cloud.time ?? 0) > (conflict.local.time ?? 0)"
                            class="note"
                            >(more recent)</span
                        >
                        <span
                            v-if="
                                (conflict.cloud.timePlayed ?? 0) > (conflict.local.timePlayed ?? 0)
                            "
                            class="note"
                            >(more playtime)</span
                        >
                    </h2>
                    <Save :save="conflict.cloud" :readonly="true" />
                </div>
                <div @click="selectLocal(i)" :class="{ selected: selectedSaves[i] === 'local' }">
                    <h2>
                        Local
                        <span
                            v-if="(conflict.cloud.time ?? 0) <= (conflict.local.time ?? 0)"
                            class="note"
                            >(more recent)</span
                        >
                        <span
                            v-if="
                                (conflict.cloud.timePlayed ?? 0) <= (conflict.local.timePlayed ?? 0)
                            "
                            class="note"
                            >(more playtime)</span
                        >
                    </h2>
                    <Save :save="conflict.local" :readonly="true" />
                </div>
                <div
                    @click="selectBoth(i)"
                    :class="{ selected: selectedSaves[i] === 'both' }"
                    style="flex-basis: 30%"
                >
                    <h2>Both</h2>
                    <div class="save">Keep Both</div>
                </div>
            </div>
        </template>
        <template v-slot:footer>
            <div class="cloud-saves-footer">
                <button @click="close" class="button">Confirm</button>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { stringifySave } from "game/player";
import settings from "game/settings";
import LZString from "lz-string";
import { conflictingSaves, galaxy } from "util/galaxy";
import { getUniqueID, save, setupInitialStore } from "util/save";
import { ComponentPublicInstance, computed, ref, unref, watch } from "vue";
import Modal from "./Modal.vue";
import Save from "./Save.vue";

const isOpen = ref(false);
// True means replacing local save with cloud save
const selectedSaves = ref<("cloud" | "local" | "both")[]>([]);

const pluralizedSave = computed(() => (conflictingSaves.value.length > 1 ? "saves" : "save"));

const modal = ref<ComponentPublicInstance<typeof Modal> | null>(null);

watch(
    () => conflictingSaves.value.length > 0,
    shouldOpen => {
        if (shouldOpen) {
            selectedSaves.value = conflictingSaves.value.map(({ local, cloud }) => {
                return (local.time ?? 0) < (cloud.time ?? 0) ? "cloud" : "local";
            });
            isOpen.value = true;
        }
    },
    { immediate: true }
);

watch(
    () => modal.value?.isOpen,
    open => {
        if (open === false) {
            conflictingSaves.value = [];
        }
    }
);

function selectLocal(index: number) {
    selectedSaves.value[index] = "local";
}

function selectCloud(index: number) {
    selectedSaves.value[index] = "cloud";
}

function selectBoth(index: number) {
    selectedSaves.value[index] = "both";
}

function close() {
    for (let i = 0; i < selectedSaves.value.length; i++) {
        const { slot, local, cloud } = conflictingSaves.value[i];
        switch (selectedSaves.value[i]) {
            case "local":
                // Replace cloud save with local
                galaxy.value
                    ?.save(
                        slot,
                        LZString.compressToUTF16(stringifySave(setupInitialStore(local))),
                        cloud.name
                    )
                    .catch(console.error);
                break;
            case "cloud":
                // Replace local save with cloud
                save(setupInitialStore(cloud));
                break;
            case "both":
                // Get a new save ID for the cloud save, and sync the local one to the cloud
                const id = getUniqueID();
                save({ ...setupInitialStore(cloud), id });
                settings.saves.push(id);
                galaxy.value
                    ?.save(
                        slot,
                        LZString.compressToUTF16(stringifySave(setupInitialStore(local))),
                        cloud.name
                    )
                    .catch(console.error);
                break;
        }
    }
    isOpen.value = false;
}
</script>

<style scoped>
.cloud-saves-modal-header {
    padding: 10px 0;
    margin-left: 10px;
}

.cloud-saves-footer {
    display: flex;
    justify-content: flex-end;
}

.cloud-saves-footer button {
    margin: 0 10px;
}

.conflict-container {
    display: flex;
}

.conflict-container > * {
    flex-basis: 50%;
    display: flex;
    flex-flow: column;
    margin: 0;
}

.conflict-container + .conflict-container {
    margin-top: 1em;
}

.conflict-container h2 {
    display: flex;
    flex-flow: column wrap;
    height: 1.5em;
    margin: 0;
}

.note {
    font-size: x-small;
    opacity: 0.7;
    margin-right: 1em;
}

.save {
    border: solid 4px var(--outline);
    padding: 4px;
    background: var(--raised-background);
    margin: var(--feature-margin);
    display: flex;
    align-items: center;
    min-height: 30px;
    height: 100%;
}
</style>

<style>
.conflict-container .save {
    cursor: pointer;
}

.conflict-container .selected .save {
    border-color: var(--bought);
}
</style>
