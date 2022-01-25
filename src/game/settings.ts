import modInfo from "@/data/modInfo.json";
import { Themes } from "@/data/themes";
import { globalBus } from "@/game/events";
import { hardReset } from "@/util/save";
import { shallowReactive, watch } from "vue";

export interface Settings {
    active: string;
    saves: string[];
    showTPS: boolean;
    theme: Themes;
    unthrottled: boolean;
}

const state = shallowReactive<Partial<Settings>>({
    active: "",
    saves: [],
    showTPS: true,
    theme: Themes.Nordic,
    unthrottled: false
});

watch(
    () => state,
    state =>
        localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(state))))),
    { deep: true }
);
export default window.settings = state as Settings;

export function loadSettings(): void {
    try {
        const item: string | null = localStorage.getItem(modInfo.id);
        if (item != null && item !== "") {
            const settings = JSON.parse(decodeURIComponent(escape(atob(item))));
            if (typeof settings === "object") {
                Object.assign(state, settings);
            }
        }
        globalBus.emit("loadSettings", state);
        // eslint-disable-next-line no-empty
    } catch {}
}

export const hardResetSettings = (window.hardResetSettings = () => {
    const settings = {
        active: "",
        saves: [],
        showTPS: true,
        theme: Themes.Nordic
    };
    globalBus.emit("loadSettings", settings);
    Object.assign(state, settings);
    hardReset();
});
