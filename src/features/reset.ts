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

/** A symbol used to identify {@link Reset} features. */
export const ResetType = Symbol("Reset");

/**
 * An object that configures a {@link Clickable}.
 */
export interface ResetOptions {
    /** List of things to reset. Can include objects which will be recursed over for persistent values. */
    thingsToReset: Computable<Record<string, unknown>[]>;
    /** A function that is called when the reset is performed. */
    onReset?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link ResetOptions} to create an {@link Reset}.
 */
export interface BaseReset {
    /** An auto-generated ID for identifying which reset is being performed. Will not persist between refreshes or updates. */
    id: string;
    /** Trigger the reset. */
    reset: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof ResetType;
}

/** An object that represents a reset mechanic, which resets progress back to its initial state. */
export type Reset<T extends ResetOptions> = Replace<
    T & BaseReset,
    {
        thingsToReset: GetComputableType<T["thingsToReset"]>;
    }
>;

/** A type that matches any valid {@link Reset} object. */
export type GenericReset = Reset<ResetOptions>;

/**
 * Lazily creates a reset with the given options.
 * @param optionsFunc Reset options.
 */
export function createReset<T extends ResetOptions>(
    optionsFunc: OptionsFunc<T, BaseReset, GenericReset>
): Reset<T> {
    return createLazyProxy(feature => {
        const reset = optionsFunc.call(feature, feature);
        reset.id = getUniqueID("reset-");
        reset.type = ResetType;

        reset.reset = function () {
            const handleObject = (obj: unknown) => {
                if (obj != null && typeof obj === "object") {
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
/**
 * Track the time since the specified reset last occured.
 * @param layer The layer the reset is attached to
 * @param reset The reset mechanic to track the time since
 */
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
