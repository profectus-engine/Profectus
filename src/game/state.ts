import { shallowReactive } from "vue";

export interface Transient {
    lastTenTicks: number[];
    hasNaN: boolean;
    NaNPath?: string[];
    NaNReceiver?: Record<string, unknown>;
}

declare global {
    /** Augment the window object so the transient state can be accessed from the console. */
    interface Window {
        state: Transient;
    }
}
export default window.state = shallowReactive<Transient>({
    lastTenTicks: [],
    hasNaN: false,
    NaNPath: []
});
