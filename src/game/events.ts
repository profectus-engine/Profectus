import projInfo from "data/projInfo.json";
import player from "game/player";
import type { Settings } from "game/settings";
import settings from "game/settings";
import state from "game/state";
import { createNanoEvents } from "nanoevents";
import Decimal from "util/bignum";
import type { App, Ref } from "vue";
import { watch } from "vue";
import type { GenericLayer } from "./layers";

/** All types of events able to be sent or emitted from the global event bus. */
export interface GlobalEvents {
    /**
     * Sent whenever a layer is added.
     * @param layer The layer being added.
     * @param saveData The layer's save data object within player.
     */
    addLayer: (layer: GenericLayer, saveData: Record<string, unknown>) => void;
    /**
     * Sent whenever a layer is removed.
     * @param layer The layer being removed.
     */
    removeLayer: (layer: GenericLayer) => void;
    /**
     * Sent every game tick. Runs the life cycle of the project.
     * @param diff The delta time since last tick, in ms.
     * @param trueDiff The delta time since last tick, in ms. Unaffected by time modifiers like {@link game/player.Player.devSpeed} or {@link game/player.Player.offlineTime}. Intended for things like updating animations.
     */
    update: (diff: number, trueDiff: number) => void;
    /**
     * Sent when constructing the {@link Settings} object.
     * Use it to add default values for custom properties to the object.
     * @param settings The settings object being constructed.
     * @see {@link features/features.setDefault} for setting default values.
     */
    loadSettings: (settings: Partial<Settings>) => void;
    /**
     * Sent when the game has ended.
     */
    gameWon: VoidFunction;
    /**
     * Sent when setting up the Vue Application instance.
     * Use it to register global components or otherwise set up things that should affect Vue globally.
     * @param vue The Vue App being constructed.
     */
    setupVue: (vue: App) => void;
    /**
     * Sent whenever a save has finished loading.
     * Happens when the page is opened and upon switching saves in the saves manager.
     */
    onLoad: VoidFunction;
    /**
     * Using document.fonts.ready returns too early on firefox, so we use document.fonts.onloadingdone instead, which doesn't accept multiple listeners.
     * This event fires when that callback is called.
     */
    fontsLoaded: VoidFunction;
}

/** A global event bus for hooking into {@link GlobalEvents}. */
export const globalBus = createNanoEvents<GlobalEvents>();

let intervalID: NodeJS.Timer | null = null;

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

/** Starts the game loop for the project, which updates the game in ticks. */
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

document.fonts.onloadingdone = () => globalBus.emit("fontsLoaded");
