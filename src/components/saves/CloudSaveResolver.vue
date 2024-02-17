<template>
    <Modal v-model="isOpen" width="960px" ref="modal">
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
                <div @click="selectCloud(i)" :class="{ selected: selectedSaves[i] }">
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
                <div @click="selectLocal(i)" :class="{ selected: !selectedSaves[i] }">
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
import Modal from "components/Modal.vue";
import { stringifySave } from "game/player";
import LZString from "lz-string";
import { conflictingSaves, galaxy } from "util/galaxy";
import { save, setupInitialStore } from "util/save";
import { ComponentPublicInstance, computed, ref, unref, watch } from "vue";
import Save from "./Save.vue";

const isOpen = ref(false);
// True means replacing local save with cloud save
const selectedSaves = ref<boolean[]>([]);

const pluralizedSave = computed(() => (conflictingSaves.value.length > 1 ? "saves" : "save"));

const modal = ref<ComponentPublicInstance<typeof Modal> | null>(null);

watch(
    () => conflictingSaves.value.length > 0,
    shouldOpen => {
        if (shouldOpen) {
            selectedSaves.value = conflictingSaves.value.map(({ local, cloud }) => {
                return (local.time ?? 0) < (cloud.time ?? 0);
            });
            isOpen.value = true;
        }
    },
    { immediate: true }
);

watch(
    () => modal.value?.isOpen,
    open => {
        console.log("!!", open);
        if (open === false) {
            conflictingSaves.value = [];
        }
    }
);

watch(
    () => modal.value?.isAnimating,
    open => {
        console.log("!! anim", open);
    }
);

function selectLocal(index: number) {
    selectedSaves.value[index] = false;
}

function selectCloud(index: number) {
    selectedSaves.value[index] = true;
}

function close() {
    for (let i = 0; i < selectedSaves.value.length; i++) {
        const { slot, local, cloud } = conflictingSaves.value[i];
        if (selectedSaves.value[i]) {
            // Replace local save with cloud
            save(setupInitialStore(cloud));
        } else {
            // Replace cloud save with cloud
            galaxy.value
                ?.save(
                    slot,
                    LZString.compressToUTF16(stringifySave(setupInitialStore(local))),
                    cloud.name ?? null
                )
                .catch(console.error);
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
}

.conflict-container + .conflict-container {
    margin-top: 1em;
}

.note {
    font-size: x-small;
    opacity: 0.7;
    margin-right: 1em;
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
