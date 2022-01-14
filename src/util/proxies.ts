import { isRef } from "vue";
import Decimal from "./bignum";
import { isFunction, isPlainObject } from "./common";

export const ProxyState = Symbol("ProxyState");
export const ProxyPath = Symbol("ProxyPath");

export type Proxied<T> = NonNullable<T> extends Record<PropertyKey, unknown>
    ? {
          [K in keyof T]: Proxied<T[K]>;
      }
    : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProxiedWithState<T> = NonNullable<T> extends Record<PropertyKey, any>
    ? NonNullable<T> extends Decimal
        ? T
        : {
              [K in keyof T]: ProxiedWithState<T[K]>;
          } & {
              [ProxyState]: T;
              [ProxyPath]: string[];
          }
    : T;

export function createProxy<T extends Record<string, unknown>>(object: T): T {
    if (object.isProxy) {
        console.warn(
            "Creating a proxy out of a proxy! This may cause unintentional function calls and stack overflows."
        );
    }
    return new Proxy(object, layerHandler) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const layerHandler: ProxyHandler<Record<PropertyKey, any>> = {
    get(target, key, receiver: typeof Proxy) {
        if (key === "isProxy") {
            return true;
        }

        if (
            isRef(target[key]) ||
            target[key].isProxy ||
            target[key] instanceof Decimal ||
            typeof key === "symbol" ||
            typeof target[key].render === "function"
        ) {
            return target[key];
        } else if (isPlainObject(target[key]) || Array.isArray(target[key])) {
            target[key] = new Proxy(target[key], layerHandler);
            return target[key];
        } else if (isFunction(target[key])) {
            return target[key].bind(receiver);
        }
        return target[key];
    }
};
