<template>
    <Modal v-model="isOpen" ref="modal">
        <template v-slot:header>
            <h2>Saves Manager</h2>
        </template>
        <template #body="{ shown }">
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
                        @editName="name => editSave(element, name)"
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
                            @update:modelValue="preset => newFromPreset(preset as string)"
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
import Modal from "components/Modal.vue";
import projInfo from "data/projInfo.json";
import type { PlayerData } from "game/player";
import player, { stringifySave } from "game/player";
import settings from "game/settings";
import LZString from "lz-string";
import { ProxyState } from "util/proxies";
import { getUniqueID, loadSave, newSave, save } from "util/save";
import type { ComponentPublicInstance } from "vue";
import { computed, nextTick, ref, shallowReactive, watch } from "vue";
import Draggable from "vuedraggable";
import Select from "./fields/Select.vue";
import Text from "./fields/Text.vue";
import Save from "./Save.vue";

export type LoadablePlayerData = Omit<Partial<PlayerData>, "id"> & { id: string; error?: unknown };

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
                if (importedSave[0] === "{") {
                    // plaintext. No processing needed
                } else if (importedSave[0] === "e") {
                    // Assumed to be base64, which starts with e
                    importedSave = decodeURIComponent(escape(atob(importedSave)));
                } else if (importedSave[0] === "ᯡ") {
                    // Assumed to be lz, which starts with ᯡ
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    importedSave = LZString.decompressFromUTF16(importedSave)!;
                } else {
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

let bankContext = import.meta.globEager("./../../saves/*.txt", { as: "raw" });
let bank = ref(
    Object.keys(bankContext).reduce((acc: Array<{ label: string; value: string }>, curr) => {
        acc.push({
            // .slice(2, -4) strips the leading ./ and the trailing .txt
            label: curr.split("/").slice(-1)[0].slice(0, -4),
            // Have to perform this unholy cast because globEager's typing doesn't appear to know
            // adding { as: "raw" } will make the object contain strings rather than modules
            value: bankContext[curr] as unknown as string
        });
        return acc;
    }, [])
);

const cachedSaves = shallowReactive<Record<string, LoadablePlayerData | undefined>>({});
function getCachedSave(id: string) {
    if (cachedSaves[id] == null) {
        let save = localStorage.getItem(id);
        if (save == null) {
            cachedSaves[id] = { error: `Save doesn't exist in localStorage`, id };
        } else if (save === "dW5kZWZpbmVk") {
            cachedSaves[id] = { error: `Save is undefined`, id };
        } else {
            try {
                if (save[0] === "{") {
                    // plaintext. No processing needed
                } else if (save[0] === "e") {
                    // Assumed to be base64, which starts with e
                    save = decodeURIComponent(escape(atob(save)));
                } else if (save[0] === "ᯡ") {
                    // Assumed to be lz, which starts with ᯡ
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    save = LZString.decompressFromUTF16(save)!;
                } else {
                    console.warn("Unable to determine preset encoding", save);
                    importingFailed.value = true;
                    cachedSaves[id] = { error: "Unable to determine preset encoding", id };
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return cachedSaves[id]!;
                }
                cachedSaves[id] = { ...JSON.parse(save), id };
            } catch (error) {
                cachedSaves[id] = { error, id };
                console.warn(
                    `SavesManager: Failed to load info about save with id ${id}:\n${error}\n${save}`
                );
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return cachedSaves[id]!;
}
// Wipe cache whenever the modal is opened
watch(isOpen, isOpen => {
    if (isOpen) {
        Object.keys(cachedSaves).forEach(key => delete cachedSaves[key]);
    }
});

const saves = computed(() =>
    settings.saves.reduce((acc: Record<string, LoadablePlayerData>, curr: string) => {
        acc[curr] = getCachedSave(curr);
        return acc;
    }, {})
);

function exportSave(id: string) {
    let saveToExport;
    if (player.id === id) {
        saveToExport = stringifySave(player[ProxyState]);
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
    save(playerData as PlayerData);

    settings.saves.push(playerData.id);
}

function deleteSave(id: string) {
    settings.saves = settings.saves.filter((save: string) => save !== id);
    localStorage.removeItem(id);
    cachedSaves[id] = undefined;
}

function openSave(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    saves.value[player.id]!.time = player.time;
    save();
    cachedSaves[player.id] = undefined;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    loadSave(saves.value[id]!);
    // Delete cached version in case of opening it again
    cachedSaves[id] = undefined;
}

function newFromPreset(preset: string) {
    // Reset preset dropdown
    selectedPreset.value = preset;
    nextTick(() => {
        selectedPreset.value = null;
    });

    if (preset[0] === "{") {
        // plaintext. No processing needed
    } else if (preset[0] === "e") {
        // Assumed to be base64, which starts with e
        preset = decodeURIComponent(escape(atob(preset)));
    } else if (preset[0] === "ᯡ") {
        // Assumed to be lz, which starts with ᯡ
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        preset = LZString.decompressFromUTF16(preset)!;
    } else {
        console.warn("Unable to determine preset encoding", preset);
        return;
    }
    const playerData = JSON.parse(preset);
    playerData.id = getUniqueID();
    save(playerData as PlayerData);

    settings.saves.push(playerData.id);

    openSave(playerData.id);
}

function editSave(id: string, newName: string) {
    const currSave = saves.value[id];
    if (currSave) {
        currSave.name = newName;
        if (player.id === id) {
            player.name = newName;
            save();
        } else {
            save(currSave as PlayerData);
            cachedSaves[id] = undefined;
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
