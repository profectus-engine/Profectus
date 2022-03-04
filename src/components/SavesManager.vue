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
                        <button class="button" @click="newSave">New Game</button>
                        <Select
                            v-if="Object.keys(bank).length > 0"
                            :options="bank"
                            :modelValue="undefined"
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
import player, { PlayerData } from "game/player";
import settings from "game/settings";
import { getUniqueID, loadSave, save, newSave } from "util/save";
import {
    ComponentPublicInstance,
    computed,
    nextTick,
    ref,
    shallowReactive,
    unref,
    watch
} from "vue";
import Select from "./fields/Select.vue";
import Text from "./fields/Text.vue";
import Save from "./Save.vue";
import Draggable from "vuedraggable";

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

let bankContext = require.context("raw-loader!../../saves", true, /\.txt$/);
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

const cachedSaves = shallowReactive<Record<string, LoadablePlayerData | undefined>>({});
function getCachedSave(id: string) {
    if (cachedSaves[id] == null) {
        const save = localStorage.getItem(id);
        if (save == null) {
            cachedSaves[id] = { error: `Save doesn't exist in localStorage`, id };
        } else if (save === "dW5kZWZpbmVk") {
            cachedSaves[id] = { error: `Save is undefined`, id };
        } else {
            try {
                cachedSaves[id] = { ...JSON.parse(decodeURIComponent(escape(atob(save)))), id };
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    loadSave(saves.value[id]!);
    // Delete cached version in case of opening it again
    cachedSaves[id] = undefined;
}

function newFromPreset(preset: string) {
    const playerData = JSON.parse(decodeURIComponent(escape(atob(preset))));
    playerData.id = getUniqueID();
    localStorage.setItem(
        playerData.id,
        btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
    );

    settings.saves.push(playerData.id);
}

function editSave(id: string, newName: string) {
    const currSave = saves.value[id];
    if (currSave) {
        currSave.name = newName;
        if (player.id === id) {
            player.name = newName;
            save();
        } else {
            localStorage.setItem(id, btoa(unescape(encodeURIComponent(JSON.stringify(currSave)))));
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
