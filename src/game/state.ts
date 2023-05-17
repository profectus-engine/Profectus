import type { DecimalSource } from "util/bignum";
import { reactive, shallowReactive } from "vue";
import type { Persistent } from "./persistence";

/** An object of global data that is not persistent. */
export interface Transient {
    /** A list of the duration, in ms, of the last 10 game ticks. Used for calculating TPS. */
    lastTenTicks: number[];
    /** Whether or not a NaN value has been detected and undealt with. */
    hasNaN: boolean;
    /** The location within the player save data object of the NaN value. */
    NaNPath?: string[];
    /** The ref that was being set to NaN. */
    NaNPersistent?: Persistent<DecimalSource>;
    /** List of errors that have occurred, to show the user. */
    errors: Error[];
}

declare global {
    /** Augment the window object so the transient state can be accessed from the console. */
    interface Window {
        state: Transient;
    }
}
/** The global transient state object. */
export default window.state = shallowReactive<Transient>({
    lastTenTicks: [],
    hasNaN: false,
    NaNPath: [],
    errors: reactive([])
});
