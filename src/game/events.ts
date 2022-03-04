import projInfo from "data/projInfo.json";
import Decimal, { DecimalSource } from "util/bignum";
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

    if (player.devSpeed === 0) {
        return;
    }

    // Add offline time if any
    if (player.offlineTime != undefined) {
        if (Decimal.gt(player.offlineTime, projInfo.offlineLimit * 3600)) {
            player.offlineTime = new Decimal(projInfo.offlineLimit * 3600);
        }
        if (Decimal.gt(player.offlineTime, 0) && player.devSpeed !== 0) {
            const offlineDiff = Decimal.div(player.offlineTime, 10).max(diff);
            player.offlineTime = Decimal.sub(player.offlineTime, offlineDiff);
            diff = diff.add(offlineDiff);
        } else if (player.devSpeed === 0) {
            player.offlineTime = Decimal.add(player.offlineTime, diff);
        }
        if (!player.offlineProd || Decimal.lt(player.offlineTime, 0)) {
            player.offlineTime = null;
        }
    }

    // Cap at max tick length
    diff = Decimal.min(diff, projInfo.maxTickLength);

    // Apply dev speed
    if (player.devSpeed != undefined) {
        diff = diff.times(player.devSpeed);
    }

    // Update
    if (diff.eq(0)) {
        return;
    }
    player.timePlayed = Decimal.add(player.timePlayed, diff);
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
    if (settings.unthrottled) {
        requestAnimationFrame(update);
    } else {
        intervalID = setInterval(update, 50);
    }
}
