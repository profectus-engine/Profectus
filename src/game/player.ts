import Decimal from "util/bignum";
import { isPlainObject } from "util/common";
import { ProxiedWithState, ProxyPath, ProxyState } from "util/proxies";
import { reactive, unref } from "vue";
import transientState from "./state";

export interface PlayerData {
    id: string;
    devSpeed: number | null;
    name: string;
    tabs: Array<string>;
    time: number;
    autosave: boolean;
    offlineProd: boolean;
    offlineTime: number | null;
    timePlayed: number;
    keepGoing: boolean;
    modID: string;
    modVersion: string;
    layers: Record<string, Record<string, unknown>>;
}

export type Player = ProxiedWithState<PlayerData>;

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
        if (key !== "value" && isPlainObject(value) && !(value instanceof Decimal)) {
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
export default window.player = new Proxy(
    { [ProxyState]: state, [ProxyPath]: ["player"] },
    playerHandler
) as Player;
