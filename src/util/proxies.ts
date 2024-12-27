import { NonPersistent } from "game/persistence";

export const ProxyState = Symbol("ProxyState");
export const AfterEvaluation = Symbol("AfterEvaluation");

/**
 * Makes a lazily evaluated object through the use of a Proxy
 * @param objectFunc Function that constructs the object to be proxies
 * @param baseObject An optional base object to pass to objectFunc, which all return properties will be assigned onto
 * @returns A proxy for the object created by objectFunc
 */
export function createLazyProxy<T extends object, S extends T>(
    objectFunc: (this: S, baseObject: S) => T,
    baseObject: S = {} as S
): T & S {
    const obj: S & Partial<T> = baseObject;
    let calculated = false;
    let calculating = false;
    const toBeEvaluated: ((proxy: S & T) => void)[] = [];
    function calculateObj(): T {
        if (!calculated) {
            if (calculating) {
                throw new Error("Cyclical dependency detected. Cannot evaluate lazy proxy.");
            }
            calculating = true;
            Object.assign(obj, objectFunc.call(obj, obj));
            calculated = true;
            toBeEvaluated.forEach(cb => cb(obj));
        }
        return obj as S & T;
    }

    function runAfterEvaluation(cb: (proxy: S & T) => void) {
        if (calculated) {
            cb(obj);
        } else {
            toBeEvaluated.push(cb);
        }
    }

    return new Proxy(obj, {
        get(target, key) {
            if (key === ProxyState) {
                return calculateObj();
            }
            if (key === AfterEvaluation) {
                return runAfterEvaluation;
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
            if (key === ProxyState || key === AfterEvaluation) {
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

/**
 * Registers a callback to be called on a lazily evaluated proxy once its been evaluated.
 * @param maybeProxy A value that may be a lazily evaluated proxy
 * @param callback The callback to call once the proxy has been evaluated (or immediately, if the object is not a proxy)
 */
export function runAfterEvaluation<T extends object>(maybeProxy: T, callback: (object: T) => void) {
    if (AfterEvaluation in maybeProxy) {
        (maybeProxy[AfterEvaluation] as (callback: (object: T) => void) => void)(callback);
    } else {
        callback(maybeProxy);
    }
}
