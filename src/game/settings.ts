import modInfo from "@/data/modInfo.json";
import { Themes } from "@/data/themes";
import { Settings } from "@/typings/settings";
import { isPlainObject } from "@/util/common";
import { hardReset } from "@/util/save";
import { reactive } from "vue";
import { MilestoneDisplay } from "./enums";

const state = reactive<Settings>({
    active: "",
    saves: [],
    showTPS: true,
    msDisplay: MilestoneDisplay.All,
    hideChallenges: false,
    theme: Themes.Nordic,
    unthrottled: false
});

const settingsHandler: ProxyHandler<Record<string, any>> = {
    get(target: Record<string, any>, key: string): any {
        if (key === "__state") {
            return target[key];
        }
        if (target.__state[key] == undefined) {
            return;
        }
        if (isPlainObject(target.__state[key])) {
            if (target.__state[key] !== target[key]?.__state) {
                target[key] = new Proxy({ __state: target.__state[key] }, settingsHandler);
            }
            return target[key];
        }

        return target.__state[key];
    },
    set(target: Record<string, any>, property: string, value: any): boolean {
        target.__state[property] = value;
        localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(state)))));
        return true;
    },
    ownKeys(target: Record<string, any>) {
        return Reflect.ownKeys(target.__state);
    },
    has(target: Record<string, any>, key: string) {
        return Reflect.has(target.__state, key);
    }
};
export default window.settings = new Proxy({ __state: state }, settingsHandler) as Settings;

export function loadSettings(): void {
    try {
        const item: string | null = localStorage.getItem(modInfo.id);
        if (item != null && item !== "") {
            const settings = JSON.parse(decodeURIComponent(escape(atob(item))));
            if (typeof settings === "object") {
                Object.assign(state, settings);
            }
        }
        // eslint-disable-next-line no-empty
    } catch {}
}

export const hardResetSettings = (window.hardResetSettings = () => {
    Object.assign(state, {
        active: "",
        saves: [],
        showTPS: true,
        msDisplay: MilestoneDisplay.All,
        hideChallenges: false,
        theme: Themes.Nordic
    });
    hardReset();
});
