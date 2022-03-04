import { hasWon } from "data/projEntry";
import { globalBus } from "game/events";
import player from "game/player";
import {
    Computable,
    GetComputableTypeWithDefault,
    GetComputableType,
    ProcessedComputable,
    processComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref } from "vue";
import { findFeatures, Replace, setDefault } from "./feature";

export const hotkeys: Record<string, GenericHotkey | undefined> = {};
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

export function createHotkey<T extends HotkeyOptions>(
    optionsFunc: () => T & ThisType<Hotkey<T>>
): Hotkey<T> {
    return createLazyProxy(() => {
        const hotkey: T & Partial<BaseHotkey> = optionsFunc();
        hotkey.type = HotkeyType;

        processComputable(hotkey as T, "enabled");
        setDefault(hotkey, "enabled", true);
        processComputable(hotkey as T, "description");

        return hotkey as unknown as Hotkey<T>;
    });
}

globalBus.on("addLayer", layer => {
    (findFeatures(layer, HotkeyType) as GenericHotkey[]).forEach(hotkey => {
        hotkeys[hotkey.key] = hotkey;
    });
});

globalBus.on("removeLayer", layer => {
    (findFeatures(layer, HotkeyType) as GenericHotkey[]).forEach(hotkey => {
        hotkeys[hotkey.key] = undefined;
    });
});

document.onkeydown = function (e) {
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
