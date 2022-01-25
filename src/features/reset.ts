import {
    DefaultValue,
    getUniqueID,
    Persistent,
    persistent,
    PersistentRef,
    Replace,
    SetupPersistence
} from "@/features/feature";
import { globalBus } from "@/game/events";
import { GenericLayer } from "@/game/layers";
import Decimal from "@/lib/break_eternity";
import { Computable, GetComputableType, processComputable } from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { Unsubscribe } from "nanoevents";
import { computed, isRef, unref } from "vue";

export const ResetType = Symbol("Reset");

export interface ResetOptions {
    thingsToReset: Computable<Record<string, unknown>[]>;
    onReset?: VoidFunction;
}

interface BaseReset {
    id: string;
    reset: VoidFunction;
    type: typeof ResetType;
}

export type Reset<T extends ResetOptions> = Replace<
    T & BaseReset,
    {
        thingsToReset: GetComputableType<T["thingsToReset"]>;
    }
>;

export type GenericReset = Reset<ResetOptions>;

export function createReset<T extends ResetOptions>(options: T & ThisType<Reset<T>>): Reset<T> {
    const reset: T & Partial<BaseReset> = options;
    reset.id = getUniqueID("reset-");
    reset.type = ResetType;

    reset.reset = function () {
        const handleObject = (obj: Record<string, unknown>) => {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (value && typeof value === "object") {
                    if (SetupPersistence in value && isRef(value)) {
                        if (DefaultValue in value) {
                            (value as PersistentRef).value = (value as PersistentRef)[DefaultValue];
                        } else if (DefaultValue in obj) {
                            (value as PersistentRef).value = (obj as unknown as Persistent)[
                                DefaultValue
                            ];
                        }
                    } else {
                        handleObject(value as Record<string, unknown>);
                    }
                }
            });
        };
        unref(proxy.thingsToReset).forEach(handleObject);
        globalBus.emit("reset", proxy);
        proxy.onReset?.();
    };

    processComputable(reset as T, "thingsToReset");

    const proxy = createProxy(reset as unknown as Reset<T>);
    return proxy;
}

export function setupAutoReset(
    layer: GenericLayer,
    reset: GenericReset,
    autoActive: Computable<boolean> = true
): void {
    const isActive = typeof autoActive === "function" ? computed(autoActive) : autoActive;
    layer.on("update", () => {
        if (unref(isActive)) {
            reset.reset();
        }
    });
}

const listeners: Record<string, Unsubscribe | undefined> = {};
export function trackResetTime(layer: GenericLayer, reset: GenericReset): PersistentRef<Decimal> {
    const resetTime = persistent<Decimal>(new Decimal(0));
    listeners[layer.id] = layer.on("preUpdate", (diff: Decimal) => {
        resetTime.value = Decimal.add(resetTime.value, diff);
    });
    globalBus.on("reset", currentReset => {
        if (currentReset === reset) {
            resetTime.value = new Decimal(0);
        }
    });
    return resetTime;
}
globalBus.on("removeLayer", layer => {
    // unsubscribe from preUpdate
    listeners[layer.id]?.();
    listeners[layer.id] = undefined;
});

declare module "@/game/events" {
    interface GlobalEvents {
        reset: (reset: GenericReset) => void;
    }
}
