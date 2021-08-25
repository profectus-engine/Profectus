<template>
    <Modal :show="show" @close="$emit('closeDialog', 'Saves')">
        <template v-slot:header>
            <h2>Saves Manager</h2>
        </template>
        <template v-slot:body v-sortable="{ update, handle: '.handle' }">
            <save
                v-for="(save, index) in saves"
                :key="index"
                :save="save"
                @open="openSave(save.id)"
                @export="exportSave(save.id)"
                @editSave="name => editSave(save.id, name)"
                @duplicate="duplicateSave(save.id)"
                @delete="deleteSave(save.id)"
            />
        </template>
        <template v-slot:footer>
            <div class="modal-footer">
                <TextField
                    :value="saveToImport"
                    @submit="importSave"
                    @input="importSave"
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
                            closeOnSelect
                            @change="newFromPreset"
                            placeholder="Select preset"
                            class="presets"
                            :value="[]"
                        />
                    </div>
                </div>
                <div class="footer">
                    <div style="flex-grow: 1"></div>
                    <button
                        class="button modal-default-button"
                        @click="$emit('closeDialog', 'Saves')"
                    >
                        Close
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import modInfo from "@/data/modInfo.json";
import player from "@/game/player";
import { PlayerData } from "@/typings/player";
import { getUniqueID, loadSave, newSave, save } from "@/util/save";
import { defineComponent } from "vue";

export default defineComponent({
    name: "SavesManager",
    props: {
        show: Boolean
    },
    emits: ["closeDialog"],
    data() {
        let bankContext = require.context("raw-loader!../../../saves", true, /\.txt$/);
        let bank = bankContext
            .keys()
            .reduce((acc: Array<{ label: string; value: string }>, curr) => {
                // .slice(2, -4) strips the leading ./ and the trailing .txt
                acc.push({
                    label: curr.slice(2, -4),
                    value: bankContext(curr).default
                });
                return acc;
            }, []);
        return {
            importingFailed: false,
            saves: {}, // Gets populated when the modal is opened
            saveToImport: "",
            bank
        } as {
            importingFailed: boolean;
            saves: Record<string, Partial<PlayerData>>;
            saveToImport: string;
            bank: Array<{ label: string; value: string }>;
        };
    },
    watch: {
        show(newValue) {
            if (newValue) {
                this.loadSaveData();
            }
        }
    },
    methods: {
        loadSaveData() {
            try {
                const { saves } = JSON.parse(
                    decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
                );
                this.saves = saves.reduce(
                    (acc: Record<string, Partial<PlayerData>>, curr: string) => {
                        try {
                            acc[curr] = JSON.parse(
                                decodeURIComponent(escape(atob(localStorage.getItem(curr)!)))
                            );
                            acc[curr].id = curr;
                        } catch (error) {
                            console.warn(`Can't load save with id "${curr}"`, error);
                            acc[curr] = { error, id: curr };
                        }
                        return acc;
                    },
                    {}
                );
            } catch (e) {
                this.saves = { [player.id]: player };
                const modData = { active: player.id, saves: [player.id] };
                localStorage.setItem(
                    modInfo.id,
                    btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
                );
            }
        },
        exportSave(id: string) {
            let saveToExport;
            if (player.id === id) {
                save();
                saveToExport = player.saveToExport;
            } else {
                saveToExport = btoa(unescape(encodeURIComponent(JSON.stringify(this.saves[id]))));
            }

            // Put on clipboard. Using the clipboard API asks for permissions and stuff
            const el = document.createElement("textarea");
            el.value = saveToExport;
            document.body.appendChild(el);
            el.select();
            el.setSelectionRange(0, 99999);
            document.execCommand("copy");
            document.body.removeChild(el);
        },
        duplicateSave(id: string) {
            if (player.id === id) {
                save();
            }

            const playerData = { ...this.saves[id], id: getUniqueID() };
            localStorage.setItem(
                playerData.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
            );

            const modData = JSON.parse(
                decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
            );
            modData.saves.push(playerData.id);
            localStorage.setItem(
                modInfo.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
            );
            this.saves[playerData.id] = playerData;
        },
        deleteSave(id: string) {
            const modData = JSON.parse(
                decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
            );
            modData.saves = modData.saves.filter((save: string) => save !== id);
            localStorage.removeItem(id);
            localStorage.setItem(
                modInfo.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
            );
            delete this.saves[id];
        },
        openSave(id: string) {
            this.saves[player.id].time = player.time;
            save();
            loadSave(this.saves[id]);
            const modData = JSON.parse(
                decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
            );
            modData.active = id;
            localStorage.setItem(
                modInfo.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
            );
        },
        newSave() {
            const playerData = newSave();
            this.saves[playerData.id] = playerData;
        },
        newFromPreset(preset: string) {
            const playerData = JSON.parse(decodeURIComponent(escape(atob(preset))));
            playerData.id = getUniqueID();
            localStorage.setItem(
                playerData.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
            );

            const modData = JSON.parse(
                decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
            );
            modData.saves.push(playerData.id);
            localStorage.setItem(
                modInfo.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
            );
            this.saves[playerData.id] = playerData;
        },
        editSave(id: string, newName: string) {
            this.saves[id].name = newName;
            if (player.id === id) {
                player.name = newName;
                save();
            } else {
                localStorage.setItem(
                    id,
                    btoa(unescape(encodeURIComponent(JSON.stringify(this.saves[id]))))
                );
            }
        },
        importSave(text: string) {
            this.saveToImport = text;
            if (text) {
                this.$nextTick(() => {
                    try {
                        const playerData = JSON.parse(decodeURIComponent(escape(atob(text))));
                        const id = getUniqueID();
                        playerData.id = id;
                        localStorage.setItem(
                            id,
                            btoa(unescape(encodeURIComponent(JSON.stringify(playerData))))
                        );
                        this.saves[id] = playerData;
                        this.saveToImport = "";
                        this.importingFailed = false;

                        const modData = JSON.parse(
                            decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
                        );
                        modData.saves.push(id);
                        localStorage.setItem(
                            modInfo.id,
                            btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
                        );
                    } catch (e) {
                        this.importingFailed = true;
                    }
                });
            } else {
                this.importingFailed = false;
            }
        },
        update(e: { newIndex: number; oldIndex: number }) {
            const modData = JSON.parse(
                decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!)))
            );
            modData.saves.splice(e.newIndex, 0, modData.saves.splice(e.oldIndex, 1)[0]);
            localStorage.setItem(
                modInfo.id,
                btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
            );
        }
    }
});
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
