import type { Settings } from "game/settings";
import { createNanoEvents } from "nanoevents";
import type { App } from "vue";
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

document.fonts.onloadingdone = () => globalBus.emit("fontsLoaded");
