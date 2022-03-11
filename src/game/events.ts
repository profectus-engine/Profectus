import projInfo from "data/projInfo.json";
import Decimal from "util/bignum";
import { createNanoEvents } from "nanoevents";
import { App, Ref, watch } from "vue";
import { GenericLayer } from "./layers";
import player from "./player";
import settings, { Settings } from "./settings";
import state from "./state";

export interface GlobalEvents {
    addLayer: (layer: GenericLayer, saveData: Record<string, unknown>) => void;
    removeLayer: (layer: GenericLayer) => void;
    update: (diff: number, trueDiff: number) => void;
    loadSettings: (settings: Partial<Settings>) => void;
    gameWon: VoidFunction;
    setupVue: (vue: App) => void;
}

export const globalBus = createNanoEvents<GlobalEvents>();

let intervalID: number | null = null;

// Not imported immediately due to dependency cycles
// This gets set during startGameLoop(), and will only be used in the update function
let hasWon: null | Ref<boolean> = null;

function update() {
    const now = Date.now();
    let diff = (now - player.time) / 1e3;
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

    diff = Math.max(diff, 0);

    if (player.devSpeed === 0) {
        return;
    }

    // Add offline time if any
    if (player.offlineTime != undefined) {
        if (Decimal.gt(player.offlineTime, projInfo.offlineLimit * 3600)) {
            player.offlineTime = projInfo.offlineLimit * 3600;
        }
        if (Decimal.gt(player.offlineTime, 0) && player.devSpeed !== 0) {
            const offlineDiff = Math.max(player.offlineTime / 10, diff);
            player.offlineTime = player.offlineTime - offlineDiff;
            diff += offlineDiff;
        } else if (player.devSpeed === 0) {
            player.offlineTime += diff;
        }
        if (!player.offlineProd || Decimal.lt(player.offlineTime, 0)) {
            player.offlineTime = null;
        }
    }

    // Cap at max tick length
    diff = Math.min(diff, projInfo.maxTickLength);

    // Apply dev speed
    if (player.devSpeed != undefined) {
        diff *= player.devSpeed;
    }

    if (!Number.isFinite(diff)) {
        diff = 1e308;
    }

    // Update
    if (Decimal.eq(diff, 0)) {
        return;
    }

    player.timePlayed += diff;
    if (!Number.isFinite(player.timePlayed)) {
        player.timePlayed = 1e308;
    }
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
    hasWon = (await import("data/projEntry")).hasWon;
    watch(hasWon, hasWon => {
        if (hasWon) {
            globalBus.emit("gameWon");
        }
    });
    if (settings.unthrottled) {
        requestAnimationFrame(update);
    } else {
        intervalID = setInterval(update, 50);
    }
}
