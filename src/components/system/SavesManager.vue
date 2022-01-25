<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <h2>Saves Manager</h2>
        </template>
        <template v-slot:body>
            <div v-sortable="{ update, handle: '.handle' }">
                <Save
                    v-for="(save, index) in saves"
                    :key="index"
                    :save="save!"
                    @open="openSave(save!.id)"
                    @export="exportSave(save!.id)"
                    @editName="name => editSave(save!.id, name)"
                    @duplicate="duplicateSave(save!.id)"
                    @delete="deleteSave(save!.id)"
                />
            </div>
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
                        <button class="button" @click="newSave">New Game</button>
                        <Select
                            v-if="Object.keys(bank).length > 0"
                            :options="bank"
                            :modelValue="[]"
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
import Modal from "@/components/system/Modal.vue";
import player, { PlayerData } from "@/game/player";
import settings from "@/game/settings";
import { getUniqueID, loadSave, save, newSave as createNewSave } from "@/util/save";
import { nextTick, ref, watch } from "vue";
import Select from "../fields/Select.vue";
import Text from "../fields/Text.vue";
import Save from "./Save.vue";
import vSortable from "vue-sortable";

export type LoadablePlayerData = Omit<Partial<PlayerData>, "id"> & { id: string; error?: unknown };

const isOpen = ref(false);

defineExpose({
    open() {
        isOpen.value = true;
    }
});

const importingFailed = ref(false);
const saveToImport = ref("");

watch(isOpen, isOpen => {
    if (isOpen) {
        loadSaveData();
    }
});

watch(saveToImport, save => {
    if (save) {
        nextTick(() => {
            try {
                const playerData = JSON.parse(decodeURIComponent(escape(atob(save))));
                if (typeof playerData !== "object") {
                    importingFailed.value = true;
                    return;
                }
                const id = getUniqueID();
                playerData.id = id;
                localStorage.setItem(
                    id,
                    btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
                );
                saves.value[id] = playerData;
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

let bankContext = require.context("raw-loader!../../../saves", true, /\.txt$/);
let bank = ref(
    bankContext.keys().reduce((acc: Array<{ label: string; value: string }>, curr) => {
        // .slice(2, -4) strips the leading ./ and the trailing .txt
        acc.push({
            label: curr.slice(2, -4),
            value: bankContext(curr).default
        });
        return acc;
    }, [])
);

const saves = ref<Record<string, LoadablePlayerData | undefined>>({});

function loadSaveData() {
    saves.value = settings.saves.reduce((acc: Record<string, LoadablePlayerData>, curr: string) => {
        try {
            const save = localStorage.getItem(curr);
            if (save == null) {
                acc[curr] = { error: `Save with id "${curr}" doesn't exist`, id: curr };
            } else {
                acc[curr] = JSON.parse(decodeURIComponent(escape(atob(save))));
                acc[curr].id = curr;
            }
        } catch (error) {
            console.warn(`Can't load save with id "${curr}"`, error);
            acc[curr] = { error, id: curr };
        }
        return acc;
    }, {});
}

function exportSave(id: string) {
    let saveToExport;
    if (player.id === id) {
        saveToExport = save();
    } else {
        saveToExport = btoa(unescape(encodeURIComponent(JSON.stringify(saves.value[id]))));
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
    localStorage.setItem(
        playerData.id,
        btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
    );

    settings.saves.push(playerData.id);
    saves.value[playerData.id] = playerData;
}

function deleteSave(id: string) {
    settings.saves = settings.saves.filter((save: string) => save !== id);
    localStorage.removeItem(id);
    saves.value[id] = undefined;
}

function openSave(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    saves.value[player.id]!.time = player.time;
    save();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    loadSave(saves.value[id]!);
}

function newSave() {
    const playerData = createNewSave();
    saves.value[playerData.id] = playerData;
}

function newFromPreset(preset: string) {
    const playerData = JSON.parse(decodeURIComponent(escape(atob(preset))));
    playerData.id = getUniqueID();
    localStorage.setItem(
        playerData.id,
        btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
    );

    settings.saves.push(playerData.id);
    saves.value[playerData.id] = playerData;
}

function editSave(id: string, newName: string) {
    saves.value[id].name = newName;
    if (player.id === id) {
        player.name = newName;
        save();
    } else {
        localStorage.setItem(
            id,
            btoa(unescape(encodeURIComponent(JSON.stringify(saves.value[id]))))
        );
    }
}

function update(e: { newIndex: number; oldIndex: number }) {
    settings.saves.splice(e.newIndex, 0, settings.saves.splice(e.oldIndex, 1)[0]);
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
