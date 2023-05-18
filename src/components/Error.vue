<template>
    <div class="error">
        <h1 class="error-title">{{ firstError.name }}: {{ firstError.message }}</h1>
        <div class="error-details" style="margin-top: -10px">
            <div v-if="firstError.cause">
                <div v-for="row in causes[0]" :key="row">{{ row }}</div>
            </div>
            <div v-if="firstError.stack" :style="firstError.cause ? 'margin-top: 10px' : ''">
                <div v-for="row in stacks[0]" :key="row">{{ row }}</div>
            </div>
        </div>
        <div class="instructions">
            Check the console for more details, and consider sharing it with the developers on
            <a :href="projInfo.discordLink || 'https://discord.gg/yJ4fjnjU54'" class="discord-link"
                >discord</a
            >!
            <FeedbackButton @click="exportSave" class="button" style="display: inline-flex"
                ><span class="material-icons" style="font-size: 16px">content_paste</span
                ><span style="margin-left: 8px; font-size: medium">Copy Save</span></FeedbackButton
            ><br />
            <div v-if="errors.length > 1" style="margin-top: 20px"><h3>Other errors</h3></div>
            <div v-for="(error, i) in errors.slice(1)" :key="i" style="margin-top: 20px">
                <details class="error-details">
                    <summary>{{ error.name }}: {{ error.message }}</summary>
                    <div v-if="error.cause" style="margin-top: 10px">
                        <div v-for="row in causes[i + 1]" :key="row">{{ row }}</div>
                    </div>
                    <div v-if="error.stack" style="margin-top: 10px">
                        <div v-for="row in stacks[i + 1]" :key="row">{{ row }}</div>
                    </div>
                </details>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import projInfo from "data/projInfo.json";
import player, { stringifySave } from "game/player";
import LZString from "lz-string";
import { computed, onMounted } from "vue";
import FeedbackButton from "./fields/FeedbackButton.vue";

const props = defineProps<{
    errors: Error[];
}>();

const firstError = computed(() => props.errors[0]);
const stacks = computed(() =>
    props.errors.map(error => (error.stack == null ? [] : error.stack.split("\n")))
);
const causes = computed(() =>
    props.errors.map(error =>
        error.cause == null
            ? []
            : (typeof error.cause === "string" ? error.cause : JSON.stringify(error.cause)).split(
                  "\n"
              )
    )
);

function exportSave() {
    let saveToExport = stringifySave(player);
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
    console.log(saveToExport);

    // Put on clipboard. Using the clipboard API asks for permissions and stuff
    const el = document.createElement("textarea");
    el.value = saveToExport;
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999);
    document.execCommand("copy");
    document.body.removeChild(el);
}

onMounted(() => {
    player.autosave = false;
    player.devSpeed = 0;
});
</script>

<style scoped>
.error {
    border: solid 10px var(--danger);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: left;
    min-height: calc(100% - 20px);
    text-align: left;
    color: var(--foreground);
}

.error-title {
    background: var(--danger);
    color: var(--feature-foreground);
    display: block;
    margin: -10px 0 10px 0;
    position: sticky;
    top: 0;
}

.error-details {
    white-space: nowrap;
    overflow: auto;
    padding: 10px;
    background-color: var(--raised-background);
}

.instructions {
    padding: 10px;
}

.discord-link {
    display: inline;
}

summary {
    cursor: pointer;
    user-select: none;
}
</style>
