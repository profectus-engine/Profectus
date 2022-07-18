import { isPlainObject } from "is-plain-object";
import Decimal from "util/bignum";
import type { ProxiedWithState } from "util/proxies";
import { ProxyPath, ProxyState } from "util/proxies";
import { reactive, unref } from "vue";
import type { Ref } from "vue";
import transientState from "./state";

/** The player save data object. */
export interface PlayerData {
    /** The ID of this save. */
    id: string;
    /** A multiplier for time passing. Set to 0 when the game is paused. */
    devSpeed: number | null;
    /** The display name of this save. */
    name: string;
    /** The open tabs. */
    tabs: Array<string>;
    /** The current time this save was last opened at, in ms since the unix epoch. */
    time: number;
    /** Whether or not to automatically save every couple of seconds and on tab close. */
    autosave: boolean;
    /** Whether or not to apply offline time when loading this save. */
    offlineProd: boolean;
    /** How much offline time has been accumulated and not yet processed. */
    offlineTime: number | null;
    /** How long, in ms, this game has been played. */
    timePlayed: number;
    /** Whether or not to continue playing after {@link data/projEntry.hasWon} is true. */
    keepGoing: boolean;
    /** The ID of this project, to make sure saves aren't imported into the wrong project. */
    modID: string;
    /** The version of the project this save was created by. Used for upgrading saves for new versions. */
    modVersion: string;
    /** A dictionary of layer save data. */
    layers: Record<string, LayerData<unknown>>;
}

/** The proxied player that is used to track NaN values. */
export type Player = ProxiedWithState<PlayerData>;

/** A layer's save data. Automatically unwraps refs. */
export type LayerData<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? Record<string, LayerData<U>>
        : T[P] extends Record<string, never>
        ? never
        : T[P] extends Ref<infer S>
        ? S
        : T[P] extends object
        ? LayerData<T[P]>
        : T[P];
};

const state = reactive<PlayerData>({
    id: "",
    devSpeed: null,
    name: "",
    tabs: [],
    time: -1,
    autosave: true,
    offlineProd: true,
    offlineTime: null,
    timePlayed: 0,
    keepGoing: false,
    modID: "",
    modVersion: "",
    layers: {}
});

/** Convert a player save data object into a JSON string. Unwraps refs. */
export function stringifySave(player: PlayerData): string {
    return JSON.stringify(player, (key, value) => unref(value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const playerHandler: ProxyHandler<Record<PropertyKey, any>> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(target: Record<PropertyKey, any>, key: PropertyKey): any {
        if (key === ProxyState || key === ProxyPath) {
            return target[key];
        }

        const value = target[ProxyState][key];
        if (key !== "value" && (isPlainObject(value) || Array.isArray(value))) {
            if (value !== target[key]?.[ProxyState]) {
                const path = [...target[ProxyPath], key];
                target[key] = new Proxy({ [ProxyState]: value, [ProxyPath]: path }, playerHandler);
            }
            return target[key];
        }

        return value;
    },
    set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target: Record<PropertyKey, any>,
        property: PropertyKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any,
        receiver: ProxyConstructor
    ): boolean {
        if (
            !transientState.hasNaN &&
            ((typeof value === "number" && isNaN(value)) ||
                (value instanceof Decimal &&
                    (isNaN(value.sign) || isNaN(value.layer) || isNaN(value.mag))))
        ) {
            const currentValue = target[ProxyState][property];
            if (
                !(
                    (typeof currentValue === "number" && isNaN(currentValue)) ||
                    (currentValue instanceof Decimal &&
                        (isNaN(currentValue.sign) ||
                            isNaN(currentValue.layer) ||
                            isNaN(currentValue.mag)))
                )
            ) {
                state.autosave = false;
                transientState.hasNaN = true;
                transientState.NaNPath = [...target[ProxyPath], property];
                transientState.NaNReceiver = receiver as unknown as Record<string, unknown>;
                console.error(
                    `Attempted to set NaN value`,
                    [...target[ProxyPath], property],
                    target[ProxyState]
                );
                throw "Attempted to set NaN value. See above for details";
            }
        }
        target[ProxyState][property] = value;
        return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ownKeys(target: Record<PropertyKey, any>) {
        return Reflect.ownKeys(target[ProxyState]);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    has(target: Record<PropertyKey, any>, key: string) {
        return Reflect.has(target[ProxyState], key);
    },
    getOwnPropertyDescriptor(target, key) {
        return Object.getOwnPropertyDescriptor(target[ProxyState], key);
    }
};

declare global {
    /** Augment the window object so the player can be accessed from the console. */
    interface Window {
        player: Player;
    }
}
/** The player save data object. */
export default window.player = new Proxy(
    { [ProxyState]: state, [ProxyPath]: ["player"] },
    playerHandler
) as Player;
