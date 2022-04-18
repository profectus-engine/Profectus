import projInfo from "data/projInfo.json";
import { Themes } from "data/themes";
import { CoercableComponent } from "features/feature";
import { globalBus } from "game/events";
import LZString from "lz-string";
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
    state => {
        let stringifiedSettings = JSON.stringify(state);
        switch (projInfo.saveEncoding) {
            default:
                console.warn(`Unknown save encoding: ${projInfo.saveEncoding}. Defaulting to lz`);
            case "lz":
                stringifiedSettings = LZString.compressToUTF16(stringifiedSettings);
                break;
            case "base64":
                stringifiedSettings = btoa(unescape(encodeURIComponent(stringifiedSettings)));
                break;
            case "plain":
                break;
        }
        localStorage.setItem(projInfo.id, stringifiedSettings);
    },
    { deep: true }
);
export default window.settings = state as Settings;

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
