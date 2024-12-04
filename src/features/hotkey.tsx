import Hotkey from "components/Hotkey.vue";
import { hasWon } from "data/projEntry";
import { findFeatures } from "features/feature";
import { globalBus } from "game/events";
import player from "game/player";
import { registerInfoComponent } from "game/settings";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { MaybeRef, MaybeRefOrGetter, shallowReactive, unref } from "vue";

/** A dictionary of all hotkeys. */
export const hotkeys: Record<string, Hotkey | undefined> = shallowReactive({});
/** A symbol used to identify {@link Hotkey} features. */
export const HotkeyType = Symbol("Hotkey");

/**
 * An object that configures a {@link Hotkey}.
 */
export interface HotkeyOptions {
    /** Whether or not this hotkey is currently enabled. */
    enabled?: MaybeRefOrGetter<boolean>;
    /** The key tied to this hotkey */
    key: string;
    /** The description of this hotkey, to display in the settings. */
    description: MaybeRefOrGetter<string>;
    /** What to do upon pressing the key. */
    onPress: (e?: MouseEvent | TouchEvent) => void;
}

/** An object that represents a hotkey shortcut that performs an action upon a key sequence being pressed. */
export interface Hotkey {
    /** Whether or not this hotkey is currently enabled. */
    enabled: MaybeRef<boolean>;
    /** The key tied to this hotkey */
    key: string;
    /** The description of this hotkey, to display in the settings. */
    description: MaybeRef<string>;
    /** What to do upon pressing the key. */
    onPress: (e?: MouseEvent | TouchEvent) => void;
    /** A symbol that helps identify features of the same type. */
    type: typeof HotkeyType;
}

const uppercaseNumbers = [")", "!", "@", "#", "$", "%", "^", "&", "*", "("];

/**
 * Lazily creates a hotkey with the given options.
 * @param optionsFunc Hotkey options.
 */
export function createHotkey<T extends HotkeyOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { enabled, description, key, onPress, ...props } = options;

        const hotkey = {
            type: HotkeyType,
            ...(props as Omit<typeof props, keyof HotkeyOptions>),
            enabled: processGetter(enabled) ?? true,
            description: processGetter(description),
            key,
            onPress
        } satisfies Hotkey;

        return hotkey;
    });
}

globalBus.on("addLayer", layer => {
    (findFeatures(layer, HotkeyType) as Hotkey[]).forEach(hotkey => {
        hotkeys[hotkey.key] = hotkey;
    });
});

globalBus.on("removeLayer", layer => {
    (findFeatures(layer, HotkeyType) as Hotkey[]).forEach(hotkey => {
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
    const keysToCheck: string[] = [e.key];
    if (e.shiftKey && e.ctrlKey) {
        keysToCheck.splice(0, 1);
        keysToCheck.push("ctrl+shift+" + e.key.toUpperCase());
        keysToCheck.push("shift+ctrl+" + e.key.toUpperCase());
        if (uppercaseNumbers.includes(e.key)) {
            keysToCheck.push("ctrl+shift+" + uppercaseNumbers.indexOf(e.key));
            keysToCheck.push("shift+ctrl+" + uppercaseNumbers.indexOf(e.key));
        } else {
            keysToCheck.push("ctrl+shift+" + e.key.toLowerCase());
            keysToCheck.push("shift+ctrl+" + e.key.toLowerCase());
        }
    } else if (uppercaseNumbers.includes(e.key)) {
        keysToCheck.push("shift+" + e.key);
        keysToCheck.push("shift+" + uppercaseNumbers.indexOf(e.key));
    } else if (e.shiftKey) {
        keysToCheck.push("shift+" + e.key.toUpperCase());
        keysToCheck.push("shift+" + e.key.toLowerCase());
    } else if (e.ctrlKey) {
        // remove e.key since the key doesn't change based on ctrl being held or not
        keysToCheck.splice(0, 1);
        keysToCheck.push("ctrl+" + e.key);
    }
    const hotkey = hotkeys[keysToCheck.find(key => key in hotkeys) ?? ""];
    if (hotkey != null && unref(hotkey.enabled) !== false) {
        e.preventDefault();
        hotkey.onPress();
    }
};

globalBus.on("setupVue", () =>
    registerInfoComponent(() => {
        const keys = Object.values(hotkeys).filter(hotkey => unref(hotkey?.enabled));
        if (keys.length === 0) {
            return "";
        }
        return (
            <div>
                <br />
                <h4>Hotkeys</h4>
                <div style="column-count: 2">
                    {keys.map(hotkey => (
                        <div>
                            <Hotkey hotkey={hotkey as Hotkey} /> {unref(hotkey?.description)}
                        </div>
                    ))}
                </div>
            </div>
        );
    })
);
