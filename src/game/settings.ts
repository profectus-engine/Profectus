import projInfo from "data/projInfo.json";
import { Themes } from "data/themes";
import { CoercableComponent } from "features/feature";
import { globalBus } from "game/events";
import { hardReset } from "util/save";
import { reactive, watch } from "vue";

export interface Settings {
    active: string;
    saves: string[];
    showTPS: boolean;
    theme: Themes;
    unthrottled: boolean;
}

const state = reactive<Partial<Settings>>({
    active: "",
    saves: [],
    showTPS: true,
    theme: Themes.Nordic,
    unthrottled: false
});

watch(
    state,
    state =>
        localStorage.setItem(
            projInfo.id,
            btoa(unescape(encodeURIComponent(JSON.stringify(state))))
        ),
    { deep: true }
);
export default window.settings = state as Settings;

export function loadSettings(): void {
    try {
        const item: string | null = localStorage.getItem(projInfo.id);
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

export const settingFields: CoercableComponent[] = reactive([]);
export function registerSettingField(component: CoercableComponent) {
    settingFields.push(component);
}

export const infoComponents: CoercableComponent[] = reactive([]);
export function registerInfoComponent(component: CoercableComponent) {
    infoComponents.push(component);
}

export const gameComponents: CoercableComponent[] = reactive([]);
export function registerGameComponent(component: CoercableComponent) {
    gameComponents.push(component);
}
