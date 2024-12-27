import { globalBus } from "game/events";
import Formula from "game/formulas/formulas";
import type { BaseLayer } from "game/layers";
import {
    DefaultValue,
    NonPersistent,
    Persistent,
    persistent,
    SkipPersistence
} from "game/persistence";
import type { Unsubscribe } from "nanoevents";
import Decimal from "util/bignum";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { isRef, MaybeRef, MaybeRefOrGetter, unref } from "vue";

/** A symbol used to identify {@link Reset} features. */
export const ResetType = Symbol("Reset");

/**
 * An object that configures a {@link features/clickables/clickable.Clickable}.
 */
export interface ResetOptions {
    /** List of things to reset. Can include objects which will be recursed over for persistent values. */
    thingsToReset: MaybeRefOrGetter<unknown[]>;
    /** A function that is called when the reset is performed. */
    onReset?: VoidFunction;
}

/** An object that represents a reset mechanic, which resets progress back to its initial state. */
export interface Reset {
    /** List of things to reset. Can include objects which will be recursed over for persistent values. */
    thingsToReset: MaybeRef<unknown[]>;
    /** A function that is called when the reset is performed. */
    onReset?: VoidFunction;
    /** Trigger the reset. */
    reset: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof ResetType;
}

/**
 * Lazily creates a reset with the given options.
 * @param optionsFunc Reset options.
 */
export function createReset<T extends ResetOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { thingsToReset, onReset, ...props } = options;

        const reset = {
            type: ResetType,
            ...(props as Omit<typeof props, keyof ResetOptions>),
            onReset,
            thingsToReset: processGetter(thingsToReset),
            reset: function () {
                const handleObject = (obj: unknown) => {
                    if (
                        obj != null &&
                        typeof obj === "object" &&
                        !(obj instanceof Decimal) &&
                        !(obj instanceof Formula)
                    ) {
                        if (SkipPersistence in obj && obj[SkipPersistence] === true) {
                            return;
                        }
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
                unref(reset.thingsToReset).forEach(handleObject);
                globalBus.emit("reset", reset);
                onReset?.();
            }
        } satisfies Reset;

        return reset;
    });
}

const listeners: Record<string, Unsubscribe | undefined> = {};
/**
 * Track the time since the specified reset last occured.
 * @param layer The layer the reset is attached to
 * @param reset The reset mechanic to track the time since
 */
export function trackResetTime(layer: BaseLayer, reset: Reset): Persistent<Decimal> {
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
        reset: (reset: Reset) => void;
    }
}
