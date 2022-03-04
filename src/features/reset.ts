import { getUniqueID, Replace } from "features/feature";
import { globalBus } from "game/events";
import { GenericLayer } from "game/layers";
import {
    DefaultValue,
    Persistent,
    persistent,
    PersistentRef,
    PersistentState
} from "game/persistence";
import Decimal from "lib/break_eternity";
import { Computable, GetComputableType, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
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

export function createReset<T extends ResetOptions>(
    optionsFunc: () => T & ThisType<Reset<T>>
): Reset<T> {
    return createLazyProxy(() => {
        const reset: T & Partial<BaseReset> = optionsFunc();
        reset.id = getUniqueID("reset-");
        reset.type = ResetType;

        reset.reset = function () {
            const handleObject = (obj: unknown) => {
                if (obj && typeof obj === "object") {
                    if (PersistentState in obj) {
                        (obj as Persistent)[PersistentState].value = (obj as Persistent)[
                            DefaultValue
                        ];
                    } else if (!(obj instanceof Decimal) && !isRef(obj)) {
                        Object.values(obj).forEach(obj =>
                            handleObject(obj as Record<string, unknown>)
                        );
                    }
                }
            };
            unref((reset as GenericReset).thingsToReset).forEach(handleObject);
            globalBus.emit("reset", reset as GenericReset);
            reset.onReset?.();
        };

        processComputable(reset as T, "thingsToReset");

        return reset as unknown as Reset<T>;
    });
}

export function setupAutoReset(
    layer: GenericLayer,
    reset: GenericReset,
    autoActive: Computable<boolean> = true
): Unsubscribe {
    const isActive = typeof autoActive === "function" ? computed(autoActive) : autoActive;
    return layer.on("update", () => {
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

declare module "game/events" {
    interface GlobalEvents {
        reset: (reset: GenericReset) => void;
    }
}
