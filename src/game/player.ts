import { Themes } from "@/data/themes";
import { PlayerData } from "@/typings/player";
import Decimal from "@/util/bignum";
import { isPlainObject } from "@/util/common";
import { reactive } from "vue";
import { ImportingStatus, MilestoneDisplay } from "./enums";

const state = reactive<PlayerData>({
    id: "",
    points: new Decimal(0),
    oomps: new Decimal(0),
    oompsMag: 0,
    name: "",
    tabs: [],
    time: -1,
    autosave: true,
    offlineProd: true,
    offlineTime: null,
    timePlayed: new Decimal(0),
    keepGoing: false,
    lastTenTicks: [],
    showTPS: true,
    msDisplay: MilestoneDisplay.All,
    hideChallenges: false,
    theme: Themes.Nordic,
    subtabs: {},
    minimized: {},
    modID: "",
    modVersion: "",
    justLoaded: false,
    hasNaN: false,
    NaNPath: [],
    NaNReceiver: null,
    importing: ImportingStatus.NotImporting,
    saveToImport: "",
    saveToExport: "",
    layers: {}
});

const playerHandler: ProxyHandler<Record<string, any>> = {
    get(target: Record<string, any>, key: string): any {
        if (key === "__state" || key === "__path") {
            return target[key];
        }
        if (target.__state[key] == undefined) {
            return;
        }
        if (isPlainObject(target.__state[key]) && !(target.__state[key] instanceof Decimal)) {
            if (target.__state[key] !== target[key]?.__state) {
                const path = [...target.__path, key];
                target[key] = new Proxy(
                    { __state: target.__state[key], __path: path },
                    playerHandler
                );
            }
            return target[key];
        }

        return target.__state[key];
    },
    set(
        target: Record<string, any>,
        property: string,
        value: any,
        receiver: ProxyConstructor
    ): boolean {
        if (
            !state.hasNaN &&
            ((typeof value === "number" && isNaN(value)) ||
                (value instanceof Decimal &&
                    (isNaN(value.sign) || isNaN(value.layer) || isNaN(value.mag))))
        ) {
            const currentValue = target.__state[property];
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
                state.hasNaN = true;
                state.NaNPath = [...target.__path, property];
                state.NaNReceiver = (receiver as unknown) as Record<string, unknown>;
                console.error(
                    `Attempted to set NaN value`,
                    [...target.__path, property],
                    target.__state
                );
                throw "Attempted to set NaN value. See above for details";
            }
        }
        target.__state[property] = value;
        if (property === "points") {
            if (target.__state.best != undefined) {
                target.__state.best = Decimal.max(target.__state.best, value);
            }
            if (target.__state.total != undefined) {
                const diff = Decimal.sub(value, target.__state.points);
                if (diff.gt(0)) {
                    target.__state.total = target.__state.total.add(diff);
                }
            }
        }
        return true;
    },
    ownKeys(target: Record<string, any>) {
        return Reflect.ownKeys(target.__state);
    },
    has(target: Record<string, any>, key: string) {
        return Reflect.has(target.__state, key);
    }
};
export default window.player = new Proxy(
    { __state: state, __path: ["player"] },
    playerHandler
) as PlayerData;
