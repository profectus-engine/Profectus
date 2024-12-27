<template>
    <Modal v-model="isOpen" ref="modal">
        <template v-slot:header>
            <h2>Saves Manager</h2>
        </template>
        <template #body="{ shown }">
            <div v-if="showNotSyncedWarning" style="color: var(--danger)">
                Not all saves are synced! You may need to delete stale saves.
            </div>
            <Draggable
                :list="settings.saves"
                handle=".handle"
                v-if="shown"
                :itemKey="(save: string) => save"
            >
                <template #item="{ element }">
                    <Save
                        :save="saves[element]"
                        @open="openSave(element)"
                        @export="exportSave(element)"
                        @editName="(name: string) => editSave(element, name)"
                        @duplicate="duplicateSave(element)"
                        @delete="deleteSave(element)"
                    />
                </template>
            </Draggable>
        </template>
        <template v-slot:footer>
            <div class="modal-footer">
                <Text
                    v-model="saveToImport"
                    title="Import Save"
                    placeholder="Paste your save here!"
                    :class="{ importingFailed }"
                />
                <div class="field">
                    <span class="field-title">Create Save</span>
                    <div class="field-buttons">
                        <button class="button" @click="openSave(newSave().id)">New Game</button>
                        <Select
                            v-if="Object.keys(bank).length > 0"
                            :options="bank"
                            :modelValue="selectedPreset"
                            @update:modelValue="(preset: unknown) => newFromPreset(preset as string)"
                            closeOnSelect
                            placeholder="Select preset"
                            class="presets"
                        />
                    </div>
                </div>
                <div class="footer">
                    <div style="flex-grow: 1"></div>
                    <button class="button modal-default-button" @click="isOpen = false">
                        Close
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import projInfo from "data/projInfo.json";
import type { Player } from "game/player";
import player, { stringifySave } from "game/player";
import settings from "game/settings";
import LZString from "lz-string";
import { galaxy, syncedSaves } from "util/galaxy";
import {
    clearCachedSave,
    clearCachedSaves,
    decodeSave,
    getCachedSave,
    getUniqueID,
    LoadablePlayerData,
    loadSave,
    newSave,
    save
} from "util/save";
import type { ComponentPublicInstance } from "vue";
import { computed, nextTick, ref, watch } from "vue";
import Draggable from "vuedraggable";
import Select from "../fields/Select.vue";
import Text from "../fields/Text.vue";
import Modal from "./Modal.vue";
import Save from "./Save.vue";

const isOpen = ref(false);
const modal = ref<ComponentPublicInstance<typeof Modal> | null>(null);

defineExpose({
    open() {
        isOpen.value = true;
    }
});

const importingFailed = ref(false);
const saveToImport = ref("");
const selectedPreset = ref<string | null>(null);

watch(saveToImport, importedSave => {
    if (importedSave) {
        nextTick(() => {
            try {
                importedSave = decodeSave(importedSave) ?? "";
                if (importedSave === "") {
                    console.warn("Unable to determine preset encoding", importedSave);
                    importingFailed.value = true;
                    return;
                }
                const playerData = JSON.parse(importedSave);
                if (typeof playerData !== "object") {
                    importingFailed.value = true;
                    return;
                }
                const id = getUniqueID();
                playerData.id = id;
                save(playerData);
                saveToImport.value = "";
                importingFailed.value = false;

                settings.saves.push(id);
            } catch (e) {
                importingFailed.value = true;
            }
        });
    } else {
        importingFailed.value = false;
    }
});

let bankContext = import.meta.glob("./../../../saves/*.txt", { query: "?raw", eager: true });
let bank = ref(
    Object.keys(bankContext).reduce((acc: Array<{ label: string; value: string }>, curr) => {
        acc.push({
            // .slice(2, -4) strips the leading ./ and the trailing .txt
            label: curr.split("/").slice(-1)[0].slice(0, -4),
            value: bankContext[curr] as string
        });
        return acc;
    }, [])
);

// Wipe cache whenever the modal is opened
watch(isOpen, isOpen => {
    if (isOpen) {
        clearCachedSaves();
    }
});

const saves = computed(() =>
    settings.saves.reduce((acc: Record<string, LoadablePlayerData>, curr: string) => {
        acc[curr] = getCachedSave(curr);
        return acc;
    }, {})
);

const showNotSyncedWarning = computed(
    () => galaxy.value?.loggedIn === true && settings.saves.length < syncedSaves.value.length
);

function exportSave(id: string) {
    let saveToExport;
    if (player.id === id) {
        saveToExport = stringifySave(player);
    } else {
        saveToExport = JSON.stringify(saves.value[id]);
    }
    switch (projInfo.exportEncoding) {
        default:
            console.warn(`Unknown save encoding: ${projInfo.exportEncoding}. Defaulting to lz`);
        case "lz":
            saveToExport = LZString.compressToUTF16(saveToExport);
            break;
        case "base64":
            saveToExport = btoa(unescape(encodeURIComponent(saveToExport)));
            break;
        case "plain":
            break;
    }

    // Put on clipboard. Using the clipboard API asks for permissions and stuff
    const el = document.createElement("textarea");
    el.value = saveToExport;
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999);
    document.execCommand("copy");
    document.body.removeChild(el);
}

function duplicateSave(id: string) {
    if (player.id === id) {
        save();
    }

    const playerData = { ...saves.value[id], id: getUniqueID() };
    save(playerData as Player);

    settings.saves.push(playerData.id);
}

function deleteSave(id: string) {
    if (galaxy.value?.loggedIn === true) {
        galaxy.value.getSaveList().then(list => {
            const slot = Object.keys(list).find(slot => {
                const content = list[parseInt(slot)].content;
                try {
                    if (JSON.parse(content).id === id) {
                        return true;
                    }
                } catch (e) {
                    return false;
                }
            });
            if (slot != null) {
                galaxy.value?.save(parseInt(slot), "", "").catch(console.error);
            }
        });
    }
    settings.saves = settings.saves.filter((save: string) => save !== id);
    localStorage.removeItem(id);
    clearCachedSave(id);
}

function openSave(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    saves.value[player.id]!.time = player.time;
    save();
    clearCachedSave(player.id);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    loadSave(saves.value[id]!);
    // Delete cached version in case of opening it again
    clearCachedSave(id);
}

function newFromPreset(preset: string) {
    // Reset preset dropdown
    selectedPreset.value = preset;
    nextTick(() => {
        selectedPreset.value = null;
    });

    preset = decodeSave(preset) ?? "";
    if (preset === "") {
        console.warn("Unable to determine preset encoding", preset);
        return;
    }
    const playerData = JSON.parse(preset);
    playerData.id = getUniqueID();
    save(playerData as Player);

    settings.saves.push(playerData.id);

    openSave(playerData.id);
}

function editSave(id: string, newName: string) {
    const currSave = saves.value[id];
    if (currSave != null) {
        currSave.name = newName;
        if (player.id === id) {
            player.name = newName;
            save();
        } else {
            save(currSave as Player);
            clearCachedSave(id);
        }
    }
}
</script>

<style scoped>
.field form,
.field .field-title,
.field .field-buttons {
    margin: 0;
}

.field-buttons {
    display: flex;
}

.field-buttons .field {
    margin: 0;
    margin-left: 8px;
}

.modal-footer {
    margin-top: -20px;
}

.footer {
    display: flex;
    margin-top: 20px;
}
</style>

<style>
.importingFailed input {
    color: red;
}

.field-buttons .v-select {
    width: 220px;
}

.presets .vue-select[aria-expanded="true"] vue-dropdown {
    visibility: hidden;
}
</style>
