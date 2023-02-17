import projInfo from "data/projInfo.json";
import { Themes } from "data/themes";
import type { CoercableComponent } from "features/feature";
import { globalBus } from "game/events";
import LZString from "lz-string";
import { hardReset } from "util/save";
import { reactive, watch } from "vue";

/** The player's settings object. */
export interface Settings {
    /** The ID of the active save. */
    active: string;
    /** The IDs of all created saves. */
    saves: string[];
    /** Whether or not to show the current ticks per second in the lower left corner of the page. */
    showTPS: boolean;
    /** The current theme to display the game in. */
    theme: Themes;
    /** Whether or not to cap the project at 20 ticks per second. */
    unthrottled: boolean;
    /** Whether to align modifiers to the unit. */
    alignUnits: boolean;
}

const state = reactive<Partial<Settings>>({
    active: "",
    saves: [],
    showTPS: true,
    theme: Themes.Nordic,
    unthrottled: false,
    alignUnits: false
});

watch(
    state,
    state => {
        const stringifiedSettings = LZString.compressToUTF16(JSON.stringify(state));
        localStorage.setItem(projInfo.id, stringifiedSettings);
    },
    { deep: true }
);

declare global {
    /**
     * Augment the window object so the settings, and hard resetting the settings, can be accessed from the console.
     */
    interface Window {
        settings: Settings;
        hardResetSettings: VoidFunction;
    }
}
/**
 * The player settings object. Stores data that persists across all saves.
 * Automatically saved to localStorage whenever changed.
 */
export default window.settings = state as Settings;
/** A function that erases all player settings, including all saves. */
export const hardResetSettings = (window.hardResetSettings = () => {
    const settings = {
        active: "",
        saves: [],
        showTPS: true,
        theme: Themes.Nordic,
        alignUnits: false
    };
    globalBus.emit("loadSettings", settings);
    Object.assign(state, settings);
    hardReset();
});

/**
 * Loads the player settings from localStorage.
 * Calls the {@link GlobalEvents.loadSettings} event for custom properties to be included.
 * Custom properties should be added by the file they relate to, so they won't be included if the file is tree shaken away.
 * Custom properties should also register the field to modify said setting using {@link registerSettingField}.
 */
export function loadSettings(): void {
    try {
        let item: string | null = localStorage.getItem(projInfo.id);
        if (item != null && item !== "") {
            if (item[0] === "{") {
                // plaintext. No processing needed
            } else if (item[0] === "e") {
                // Assumed to be base64, which starts with e
                item = decodeURIComponent(escape(atob(item)));
            } else if (item[0] === "ᯡ") {
                // Assumed to be lz, which starts with ᯡ
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                item = LZString.decompressFromUTF16(item)!;
            } else {
                console.warn("Unable to determine settings encoding", item);
                return;
            }
            const settings = JSON.parse(item);
            if (typeof settings === "object") {
                Object.assign(state, settings);
            }
        }
        globalBus.emit("loadSettings", state);
        // eslint-disable-next-line no-empty
    } catch {}
}

/** A list of fields to append to the settings modal. */
export const settingFields: CoercableComponent[] = reactive([]);
/** Register a field to be displayed in the settings modal. */
export function registerSettingField(component: CoercableComponent) {
    settingFields.push(component);
}

/** A list of components to show in the info modal. */
export const infoComponents: CoercableComponent[] = reactive([]);
/** Register a component to be displayed in the info modal. */
export function registerInfoComponent(component: CoercableComponent) {
    infoComponents.push(component);
}

/** A list of components to add to the root of the page. */
export const gameComponents: CoercableComponent[] = reactive([]);
/** Register a component to be displayed at the root of the page. */
export function registerGameComponent(component: CoercableComponent) {
    gameComponents.push(component);
}
