import { hasWon } from "data/projEntry";
import type { OptionsFunc, Replace } from "features/feature";
import { findFeatures, jsx, setDefault } from "features/feature";
import { globalBus } from "game/events";
import player from "game/player";
import { registerInfoComponent } from "game/settings";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { shallowReactive, unref } from "vue";

export const hotkeys: Record<string, GenericHotkey | undefined> = shallowReactive({});
export const HotkeyType = Symbol("Hotkey");

export interface HotkeyOptions {
    enabled?: Computable<boolean>;
    key: string;
    description: Computable<string>;
    onPress: VoidFunction;
}

export interface BaseHotkey {
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
    optionsFunc: OptionsFunc<T, BaseHotkey, GenericHotkey>
): Hotkey<T> {
    return createLazyProxy(() => {
        const hotkey = optionsFunc();
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

registerInfoComponent(
    jsx(() => {
        const keys = Object.values(hotkeys).filter(hotkey => unref(hotkey?.enabled));
        if (keys.length === 0) {
            return "";
        }
        return (
            <div>
                <br />
                <h4>Hotkeys</h4>
                {keys.map(hotkey => (
                    <div>
                        {hotkey?.key}: {hotkey?.description}
                    </div>
                ))}
            </div>
        );
    })
);
