import Decimal from "./bignum";

export const ProxyState = Symbol("ProxyState");
export const ProxyPath = Symbol("ProxyPath");

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

// Takes a function that returns an object and pretends to be that object
// Note that the object is lazily calculated
export function createLazyProxy<T extends object, S>(
    objectFunc: (baseObject: S) => T & S,
    baseObject: S = {} as S
): T {
    const obj: S & Partial<T> = baseObject;
    let calculated = false;
    function calculateObj(): T {
        if (!calculated) {
            Object.assign(obj, objectFunc(obj));
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
            return (calculateObj() as any)[key];
        },
        set(target, key, value) {
            console.error("Layers and features are shallow readonly", key, value);
            return false;
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
                Object.assign(obj, objectFunc(obj));
                calculated = true;
            }
            return Object.getOwnPropertyDescriptor(target, key);
        }
    }) as S & T;
}
