import { Transient } from "@/typings/transient";
import Decimal from "@/util/bignum";
import { isPlainObject } from "@/util/common";
import { reactive } from "vue";

const state = reactive<Transient>({
    lastTenTicks: [],
    hasNaN: false,
    NaNPath: [],
    lastPoints: new Decimal(0),
    saveToExport: "",
    oomps: new Decimal(0),
    oompsMag: 0
});

const stateHandler: ProxyHandler<Record<string, any>> = {
    get(target: Record<string, any>, key: string): any {
        if (key === "__state") {
            return target[key];
        }
        if (target.__state[key] == undefined) {
            return;
        }
        if (isPlainObject(target.__state[key])) {
            if (target.__state[key] !== target[key]?.__state) {
                target[key] = new Proxy({ __state: target.__state[key] }, stateHandler);
            }
            return target[key];
        }

        return target.__state[key];
    },
    set(target: Record<string, any>, property: string, value: any): boolean {
        target.__state[property] = value;
        return true;
    },
    ownKeys(target: Record<string, any>) {
        return Reflect.ownKeys(target.__state);
    },
    has(target: Record<string, any>, key: string) {
        return Reflect.has(target.__state, key);
    }
};
export default window.state = new Proxy({ __state: state }, stateHandler) as Transient;
