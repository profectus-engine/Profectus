<template>
    <div class="save" :class="{ active }">
        <div class="handle material-icons">drag_handle</div>
        <div class="actions" v-if="!editing">
            <feedback-button
                @click="$emit('export')"
                class="button"
                left
                v-if="save.error == undefined && !confirming"
            >
                <span class="material-icons">content_paste</span>
            </feedback-button>
            <button
                @click="$emit('duplicate')"
                class="button"
                v-if="save.error == undefined && !confirming"
            >
                <span class="material-icons">content_copy</span>
            </button>
            <button
                @click="toggleEditing"
                class="button"
                v-if="save.error == undefined && !confirming"
            >
                <span class="material-icons">edit</span>
            </button>
            <danger-button
                :disabled="active"
                @click="$emit('delete')"
                @confirmingChanged="confirmingChanged"
            >
                <span class="material-icons" style="margin: -2px">delete</span>
            </danger-button>
        </div>
        <div class="actions" v-else>
            <button @click="changeName" class="button">
                <span class="material-icons">check</span>
            </button>
            <button @click="toggleEditing" class="button">
                <span class="material-icons">close</span>
            </button>
        </div>
        <div class="details" v-if="save.error == undefined && !editing">
            <button class="button open" @click="$emit('open')">
                <h3>{{ save.name }}</h3>
            </button>
            <span class="save-version">v{{ save.modVersion }}</span
            ><br />
            <div v-if="time">Last played {{ dateFormat.format(time) }}</div>
        </div>
        <div class="details" v-else-if="save.error == undefined && editing">
            <TextField v-model="newName" class="editname" @submit="changeName" />
        </div>
        <div v-else class="details error">Error: Failed to load save with id {{ save.id }}</div>
    </div>
</template>

<script lang="ts">
import player from "@/game/player";
import { PlayerData } from "@/typings/player";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "save",
    props: {
        save: {
            type: Object as PropType<Partial<PlayerData>>,
            required: true
        }
    },
    emits: ["export", "open", "duplicate", "delete", "editSave"],
    data() {
        return {
            dateFormat: new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric"
            }),
            editing: false,
            confirming: false,
            newName: ""
        };
    },
    computed: {
        active(): boolean {
            return this.save.id === player.id;
        },
        time(): number | undefined {
            return this.active ? player.time : this.save.time;
        }
    },
    methods: {
        confirmingChanged(confirming: boolean) {
            this.confirming = confirming;
        },
        toggleEditing() {
            this.newName = this.save.name || "";
            this.editing = !this.editing;
        },
        changeName() {
            this.$emit("editSave", this.newName);
            this.editing = false;
        }
    }
});
</script>

<style scoped>
.save {
    position: relative;
    border: solid 4px var(--separator);
    padding: 4px;
    background: var(--secondary-background);
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
    background: inherit;
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
