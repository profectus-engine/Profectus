<template>
    <div class="save" :class="{ active: isActive }">
        <div class="handle material-icons">drag_handle</div>
        <div class="actions" v-if="!isEditing">
            <FeedbackButton
                @click="emit('export')"
                class="button"
                left
                v-if="save.error == undefined && !isConfirming"
            >
                <Tooltip display="Export" :direction="Direction.Left" class="info">
                    <span class="material-icons">content_paste</span>
                </Tooltip>
            </FeedbackButton>
            <button
                @click="emit('duplicate')"
                class="button"
                v-if="save.error == undefined && !isConfirming"
            >
                <Tooltip display="Duplicate" :direction="Direction.Left" class="info">
                    <span class="material-icons">content_copy</span>
                </Tooltip>
            </button>
            <button
                @click="isEditing = !isEditing"
                class="button"
                v-if="save.error == undefined && !isConfirming"
            >
                <Tooltip display="Edit Name" :direction="Direction.Left" class="info">
                    <span class="material-icons">edit</span>
                </Tooltip>
            </button>
            <DangerButton
                :disabled="isActive"
                @click="emit('delete')"
                @confirmingChanged="(value: boolean) => (isConfirming = value)"
            >
                <Tooltip display="Delete" :direction="Direction.Left" class="info">
                    <span class="material-icons" style="margin: -2px">delete</span>
                </Tooltip>
            </DangerButton>
        </div>
        <div class="actions" v-else>
            <button @click="changeName" class="button">
                <Tooltip display="Save" :direction="Direction.Left" class="info">
                    <span class="material-icons">check</span>
                </Tooltip>
            </button>
            <button @click="isEditing = !isEditing" class="button">
                <Tooltip display="Cancel" :direction="Direction.Left" class="info">
                    <span class="material-icons">close</span>
                </Tooltip>
            </button>
        </div>
        <div class="details" v-if="save.error == undefined && !isEditing">
            <button class="button open" @click="emit('open')">
                <h3>{{ save.name }}</h3>
            </button>
            <span class="save-version">v{{ save.modVersion }}</span
            ><br />
            <div v-if="currentTime">Last played {{ dateFormat.format(currentTime) }}</div>
        </div>
        <div class="details" v-else-if="save.error == undefined && isEditing">
            <Text v-model="newName" class="editname" @submit="changeName" />
        </div>
        <div v-else class="details error">
            Error: Failed to load save with id {{ save.id }}<br />{{ save.error }}
        </div>
    </div>
</template>

<script setup lang="ts">
import Tooltip from "features/tooltips/Tooltip.vue";
import player from "game/player";
import { Direction } from "util/common";
import { computed, ref, toRefs, watch } from "vue";
import DangerButton from "./fields/DangerButton.vue";
import FeedbackButton from "./fields/FeedbackButton.vue";
import Text from "./fields/Text.vue";
import type { LoadablePlayerData } from "./SavesManager.vue";

const _props = defineProps<{
    save: LoadablePlayerData;
}>();
const { save } = toRefs(_props);
const emit = defineEmits<{
    (e: "export"): void;
    (e: "open"): void;
    (e: "duplicate"): void;
    (e: "delete"): void;
    (e: "editName", name: string): void;
}>();

const dateFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
});

const isEditing = ref(false);
const isConfirming = ref(false);
const newName = ref("");

watch(isEditing, () => (newName.value = save.value.name ?? ""));

const isActive = computed(() => save.value != null && save.value.id === player.id);
const currentTime = computed(() =>
    isActive.value ? player.time : (save.value != null && save.value.time) ?? 0
);

function changeName() {
    emit("editName", newName.value);
    isEditing.value = false;
}
</script>

<style scoped>
.save {
    position: relative;
    border: solid 4px var(--outline);
    padding: 4px;
    background: var(--raised-background);
    margin: var(--feature-margin);
    display: flex;
    align-items: center;
    min-height: 30px;
}

.save.active {
    border-color: var(--bought);
}

.open {
    display: inline;
    margin: 0;
    padding-left: 0;
}

.handle {
    flex-grow: 0;
    margin-right: 8px;
    margin-left: 0;
    cursor: pointer;
}

.details {
    margin: 0;
    flex-grow: 1;
    margin-right: 80px;
}

.error {
    font-size: 0.8em;
    color: var(--danger);
}

.save-version {
    margin-left: 4px;
    font-size: 0.7em;
    opacity: 0.7;
}

.actions {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 4px;
    display: flex;
    padding: 4px;
    z-index: 1;
}

.editname {
    margin: 0;
}
</style>

<style>
.save button {
    transition-duration: 0s;
}

.save .actions button {
    display: flex;
    font-size: 1.2em;
}

.save .actions button .material-icons {
    font-size: unset;
}

.save .button.danger {
    display: flex;
    align-items: center;
    padding: 4px;
}

.save .field {
    margin: 0;
}
</style>
