import { shallowReactive } from "vue";

export interface Transient {
    lastTenTicks: number[];
    hasNaN: boolean;
    NaNPath?: string[];
    NaNReceiver?: Record<string, unknown>;
}

export default window.state = shallowReactive<Transient>({
    lastTenTicks: [],
    hasNaN: false,
    NaNPath: []
});
