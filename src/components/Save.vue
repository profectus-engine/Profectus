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
                <span class="material-icons">content_paste</span>
            </FeedbackButton>
            <button
                @click="emit('duplicate')"
                class="button"
                v-if="save.error == undefined && !isConfirming"
            >
                <span class="material-icons">content_copy</span>
            </button>
            <button
                @click="isEditing = !isEditing"
                class="button"
                v-if="save.error == undefined && !isConfirming"
            >
                <span class="material-icons">edit</span>
            </button>
            <DangerButton
                :disabled="isActive"
                @click="emit('delete')"
                @confirmingChanged="value => (isConfirming = value)"
            >
                <span class="material-icons" style="margin: -2px">delete</span>
            </DangerButton>
        </div>
        <div class="actions" v-else>
            <button @click="changeName" class="button">
                <span class="material-icons">check</span>
            </button>
            <button @click="isEditing = !isEditing" class="button">
                <span class="material-icons">close</span>
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
import player from "game/player";
import { computed, ref, toRefs, watch } from "vue";
import DangerButton from "./fields/DangerButton.vue";
import FeedbackButton from "./fields/FeedbackButton.vue";
import Text from "./fields/Text.vue";
import { LoadablePlayerData } from "./SavesManager.vue";

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

watch(isEditing, () => (newName.value = save.value.name || ""));

const isActive = computed(() => save.value && save.value.id === player.id);
const currentTime = computed(() =>
    isActive.value ? player.time : (save.value && save.value.time) || 0
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
