import modInfo from "@/data/modInfo.json";
import Decimal, { DecimalSource } from "@/util/bignum";
import { createNanoEvents } from "nanoevents";
import { App, Ref } from "vue";
import { GenericLayer } from "./layers";
import player from "./player";
import settings, { Settings } from "./settings";
import state from "./state";

export interface GlobalEvents {
    addLayer: (layer: GenericLayer, saveData: Record<string, unknown>) => void;
    removeLayer: (layer: GenericLayer) => void;
    update: (diff: Decimal, trueDiff: number) => void;
    loadSettings: (settings: Partial<Settings>) => void;
    setupVue: (vue: App) => void;
}

export const globalBus = createNanoEvents<GlobalEvents>();

let intervalID: number | null = null;

// Not imported immediately due to dependency cycles
// This gets set during startGameLoop(), and will only be used in the update function
let hasWon: null | Ref<boolean> = null;

function update() {
    const now = Date.now();
    let diff: DecimalSource = (now - player.time) / 1e3;
    player.time = now;
    const trueDiff = diff;

    state.lastTenTicks.push(trueDiff);
    if (state.lastTenTicks.length > 10) {
        state.lastTenTicks = state.lastTenTicks.slice(1);
    }

    // Stop here if the game is paused on the win screen
    if (hasWon?.value && !player.keepGoing) {
        return;
    }
    // Stop here if the player had a NaN value
    if (state.hasNaN) {
        return;
    }

    diff = new Decimal(diff).max(0);

    // Add offline time if any
    if (player.offlineTime != undefined) {
        if (player.offlineTime.gt(modInfo.offlineLimit * 3600)) {
            player.offlineTime = new Decimal(modInfo.offlineLimit * 3600);
        }
        if (player.offlineTime.gt(0) && player.devSpeed !== 0) {
            const offlineDiff = Decimal.max(player.offlineTime.div(10), diff);
            player.offlineTime = player.offlineTime.sub(offlineDiff);
            diff = diff.add(offlineDiff);
        } else if (player.devSpeed === 0) {
            player.offlineTime = player.offlineTime.add(diff);
        }
        if (!player.offlineProd || player.offlineTime.lt(0)) {
            player.offlineTime = null;
        }
    }

    // Cap at max tick length
    diff = Decimal.min(diff, modInfo.maxTickLength);

    // Apply dev speed
    if (player.devSpeed != undefined) {
        diff = diff.times(player.devSpeed);
    }

    // Update
    if (diff.eq(0)) {
        return;
    }
    player.timePlayed = player.timePlayed.add(diff);
    globalBus.emit("update", diff, trueDiff);

    if (settings.unthrottled) {
        requestAnimationFrame(update);
        if (intervalID != null) {
            clearInterval(intervalID);
            intervalID = null;
        }
    } else if (intervalID == null) {
        intervalID = setInterval(update, 50);
    }
}

export async function startGameLoop() {
    hasWon = (await import("@/data/mod")).hasWon;
    if (settings.unthrottled) {
        requestAnimationFrame(update);
    } else {
        intervalID = setInterval(update, 50);
    }
}
