import type { Persistent } from "game/persistence";
import { NonPersistent } from "game/persistence";
import Decimal from "util/bignum";

export const ProxyState = Symbol("ProxyState");
export const ProxyPath = Symbol("ProxyPath");

export type ProxiedWithState<T> = NonNullable<T> extends Record<PropertyKey, unknown>
    ? NonNullable<T> extends Decimal
        ? T
        : {
              [K in keyof T]: ProxiedWithState<T[K]>;
          } & {
              [ProxyState]: T;
              [ProxyPath]: string[];
          }
    : T;

export type Proxied<T> = NonNullable<T> extends Record<PropertyKey, unknown>
    ? NonNullable<T> extends Persistent<infer S>
        ? NonPersistent<S>
        : NonNullable<T> extends Decimal
        ? T
        : {
              [K in keyof T]: Proxied<T[K]>;
          } & {
              [ProxyState]: T;
          }
    : T;

// Takes a function that returns an object and pretends to be that object
// Note that the object is lazily calculated
export function createLazyProxy<T extends object, S extends T>(
    objectFunc: (this: S, baseObject: S) => T & S,
    baseObject: S = {} as S
): T {
    const obj: S & Partial<T> = baseObject;
    let calculated = false;
    let calculating = false;
    function calculateObj(): T {
        if (!calculated) {
            if (calculating) {
                console.error("Cyclical dependency detected. Cannot evaluate lazy proxy.");
            }
            calculating = true;
            Object.assign(obj, objectFunc.call(obj, obj));
            calculated = true;
        }
        return obj as S & T;
    }

    return new Proxy(obj, {
        get(target, key) {
            if (key === ProxyState) {
                return calculateObj();
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const val = (calculateObj() as any)[key];
            if (val != null && typeof val === "object" && NonPersistent in val) {
                return val[NonPersistent];
            }
            return val;
        },
        set(target, key, value) {
            // TODO give warning about this? It should only be done with caution
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (calculateObj() as any)[key] = value;
            return true;
        },
        has(target, key) {
            if (key === ProxyState) {
                return true;
            }
            return Reflect.has(calculateObj(), key);
        },
        ownKeys() {
            return Reflect.ownKeys(calculateObj());
        },
        getOwnPropertyDescriptor(target, key) {
            if (!calculated) {
                Object.assign(obj, objectFunc.call(obj, obj));
                calculated = true;
            }
            return Object.getOwnPropertyDescriptor(target, key);
        }
    }) as S & T;
}
