import { computed, isRef } from "vue";
import Decimal from "./bignum";
import { isFunction, isPlainObject } from "./common";

export function createLayerProxy(object: Record<string, any>): Record<string, any> {
    if (object.isProxy) {
        console.warn(
            "Creating a proxy out of a proxy! This may cause unintentional function calls and stack overflows."
        );
    }
    const objectProxy = new Proxy(object, layerHandler);
    travel(createLayerProxy, object, objectProxy);
    return objectProxy;
}

export function createGridProxy(object: Record<string, any>): Record<string, any> {
    if (object.isProxy) {
        console.warn(
            "Creating a proxy out of a proxy! This may cause unintentional function calls and stack overflows."
        );
    }
    const objectProxy = new Proxy(object, gridHandler);
    travel(createGridProxy, object, objectProxy);
    return objectProxy;
}

function travel(
    callback: (object: Record<string, any>) => void,
    object: Record<string, any>,
    objectProxy: Record<string, any>
) {
    for (const key in object) {
        if (object[key] == undefined || object[key].isProxy || isRef(object[key])) {
            continue;
        }
        if (isFunction(object[key])) {
            if (
                (object[key].length !== 0 && object[key].forceCached !== true) ||
                object[key].forceCached === false
            ) {
                continue;
            }
            object[key] = computed(object[key].bind(objectProxy));
        } else if (
            (isPlainObject(object[key]) || Array.isArray(object[key])) &&
            !(object[key] instanceof Decimal) &&
            typeof object[key].render !== "function"
        ) {
            object[key] = callback(object[key]);
        }
    }
}

const layerHandler: ProxyHandler<Record<string, any>> = {
    get(target: Record<string, any>, key: string, receiver: typeof Proxy): any {
        if (key === "isProxy") {
            return true;
        }

        if (target[key] == undefined) {
            return;
        }

        if (isRef(target[key])) {
            return target[key].value;
        } else if (
            target[key].isProxy ||
            target[key] instanceof Decimal ||
            typeof target[key].render === "function"
        ) {
            return target[key];
        } else if (
            (isPlainObject(target[key]) || Array.isArray(target[key])) &&
            key.slice(0, 2) !== "__"
        ) {
            console.warn(
                "Creating proxy outside `createProxy`. This may cause issues when calling proxied functions.",
                target,
                key
            );
            target[key] = new Proxy(target[key], layerHandler);
            return target[key];
        } else if (isFunction(target[key])) {
            return target[key].bind(receiver);
        }
        return target[key];
    },
    set(target: Record<string, any>, key: string, value: any, receiver: typeof Proxy): boolean {
        if (
            `${key}Set` in target &&
            isFunction(target[`${key}Set`]) &&
            target[`${key}Set`].length < 2
        ) {
            target[`${key}Set`].call(receiver, value);
            return true;
        } else {
            console.warn(`No setter for "${key}".`, target);
            return false;
        }
    }
};

const gridHandler: ProxyHandler<Record<string, any>> = {
    get(target: Record<string, any>, key: string, receiver: typeof Proxy): any {
        if (key === "isProxy") {
            return true;
        }

        if (isRef(target[key])) {
            return target[key].value;
        } else if (target[key] && (target[key].isProxy || target[key] instanceof Decimal)) {
            return target[key];
        } else if (isPlainObject(target[key]) || Array.isArray(target[key])) {
            console.warn(
                "Creating proxy outside `createProxy`. This may cause issues when calling proxied functions.",
                target,
                key
            );
            target[key] = new Proxy(target[key], layerHandler);
            return target[key];
        } else if (isFunction(target[key])) {
            return target[key].bind(receiver);
        }
        if (typeof key !== "symbol" && !isNaN(Number(key))) {
            target[key] = new Proxy(target, getCellHandler(key));
        }
        return target[key];
    },
    set(target: Record<string, any>, key: string, value: any, receiver: typeof Proxy): boolean {
        if (
            `${key}Set` in target &&
            isFunction(target[`${key}Set`]) &&
            target[`${key}Set`].length < 2
        ) {
            target[`${key}Set`].call(receiver, value);
            return true;
        } else {
            console.warn(`No setter for "${key}".`, target);
            return false;
        }
    }
};

function getCellHandler(id: string) {
    return {
        get(target: Record<string, any>, key: string, receiver: typeof Proxy): any {
            if (key === "isProxy") {
                return true;
            }

            let prop = target[key];

            if (isFunction(prop) && prop.forceCached === false) {
                return () => prop.call(receiver, id, target.getData(id));
            }
            if (prop != undefined || key.slice == undefined) {
                return prop;
            }

            key = key.slice(0, 1).toUpperCase() + key.slice(1);
            prop = target[`get${key}`];
            if (isFunction(prop)) {
                return prop.call(receiver, id, target.getData(id));
            } else if (prop != undefined) {
                return prop;
            }

            prop = target[`on${key}`];
            if (isFunction(prop)) {
                return () => prop.call(receiver, id, target.getData(id));
            } else if (prop != undefined) {
                return prop;
            }

            return target[key];
        },
        set(target: Record<string, any>, key: string, value: any, receiver: typeof Proxy): boolean {
            if (
                `${key}Set` in target &&
                isFunction(target[`${key}Set`]) &&
                target[`${key}Set`].length < 3
            ) {
                target[`${key}Set`].call(receiver, id, value);
                return true;
            } else {
                console.warn(`No setter for "${key}".`, target);
                return false;
            }
        }
    };
}
