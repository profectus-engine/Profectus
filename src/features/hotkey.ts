import { hasWon } from "@/data/mod";
import { globalBus } from "@/game/events";
import player from "@/game/player";
import {
    Computable,
    GetComputableTypeWithDefault,
    GetComputableType,
    ProcessedComputable,
    processComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { unref } from "vue";
import { findFeatures, Replace, setDefault } from "./feature";

export const hotkeys: Record<string, GenericHotkey> = {};
export const HotkeyType = Symbol("Hotkey");

export interface HotkeyOptions {
    enabled?: Computable<boolean>;
    key: string;
    description: Computable<string>;
    onPress: VoidFunction;
}

interface BaseHotkey {
    type: typeof HotkeyType;
}

export type Hotkey<T extends HotkeyOptions> = Replace<
    T & BaseHotkey,
    {
        enabled: GetComputableTypeWithDefault<T["enabled"], true>;
        description: GetComputableType<T["description"]>;
    }
>;

export type GenericHotkey = Replace<
    Hotkey<HotkeyOptions>,
    {
        enabled: ProcessedComputable<boolean>;
    }
>;

export function createHotkey<T extends HotkeyOptions>(options: T & ThisType<Hotkey<T>>): Hotkey<T> {
    const hotkey: T & Partial<BaseHotkey> = options;
    hotkey.type = HotkeyType;

    processComputable(hotkey as T, "enabled");
    setDefault(hotkey, "enabled", true);
    processComputable(hotkey as T, "description");

    const proxy = createProxy((hotkey as unknown) as Hotkey<T>);
    return proxy;
}

globalBus.on("addLayer", layer => {
    (findFeatures(layer, HotkeyType) as GenericHotkey[]).forEach(hotkey => {
        hotkeys[hotkey.key] = hotkey;
    });
});

globalBus.on("removeLayer", layer => {
    (findFeatures(layer, HotkeyType) as GenericHotkey[]).forEach(hotkey => {
        delete hotkeys[hotkey.key];
    });
});

document.onkeydown = function(e) {
    if ((e.target as HTMLElement | null)?.tagName === "INPUT") {
        return;
    }
    if (hasWon.value && !player.keepGoing) {
        return;
    }
    let key = e.key;
    if (e.shiftKey) {
        key = "shift+" + key;
    }
    if (e.ctrlKey) {
        key = "ctrl+" + key;
    }
    const hotkey = hotkeys[key];
    if (hotkey && unref(hotkey.enabled)) {
        e.preventDefault();
        hotkey.onPress();
    }
};
