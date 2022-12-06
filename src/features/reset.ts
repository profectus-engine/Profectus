import type { OptionsFunc, Replace } from "features/feature";
import { getUniqueID } from "features/feature";
import { globalBus } from "game/events";
import type { BaseLayer } from "game/layers";
import type { NonPersistent, Persistent } from "game/persistence";
import { DefaultValue, persistent } from "game/persistence";
import type { Unsubscribe } from "nanoevents";
import Decimal from "util/bignum";
import type { Computable, GetComputableType } from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { isRef, unref } from "vue";

export const ResetType = Symbol("Reset");

export interface ResetOptions {
    thingsToReset: Computable<Record<string, unknown>[]>;
    onReset?: VoidFunction;
}

export interface BaseReset {
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
    optionsFunc: OptionsFunc<T, BaseReset, GenericReset>
): Reset<T> {
    return createLazyProxy(() => {
        const reset = optionsFunc();
        reset.id = getUniqueID("reset-");
        reset.type = ResetType;

        reset.reset = function () {
            const handleObject = (obj: unknown) => {
                if (obj && typeof obj === "object") {
                    if (DefaultValue in obj) {
                        const persistent = obj as NonPersistent;
                        persistent.value = persistent[DefaultValue];
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

const listeners: Record<string, Unsubscribe | undefined> = {};
export function trackResetTime(layer: BaseLayer, reset: GenericReset): Persistent<Decimal> {
    const resetTime = persistent<Decimal>(new Decimal(0));
    globalBus.on("addLayer", layerBeingAdded => {
        if (layer.id === layerBeingAdded.id) {
            listeners[layer.id]?.();
            listeners[layer.id] = layer.on("preUpdate", diff => {
                resetTime.value = Decimal.add(resetTime.value, diff);
            });
        }
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
