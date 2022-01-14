import { App as VueApp, createApp } from "vue";
import App from "./App.vue";
import modInfo from "./data/modInfo.json";
import { globalBus, startGameLoop } from "./game/events";
import { GenericLayer } from "./game/layers";
import { PlayerData } from "./game/player";
import { Settings } from "./game/settings";
import { Transient } from "./game/state";
import Decimal, { DecimalSource } from "./lib/break_eternity";
import { load } from "./util/save";

declare global {
    interface Window {
        vue: VueApp;
        save: VoidFunction;
        hardReset: VoidFunction;
        hardResetSettings: VoidFunction;
        layers: Record<string, Readonly<GenericLayer>>;
        player: PlayerData;
        state: Transient;
        settings: Settings;
        Decimal: typeof Decimal;
        exponentialFormat: (num: DecimalSource, precision: number, mantissa: boolean) => string;
        commaFormat: (num: DecimalSource, precision: number) => string;
        regularFormat: (num: DecimalSource, precision: number) => string;
        format: (num: DecimalSource, precision?: number, small?: boolean) => string;
        formatWhole: (num: DecimalSource) => string;
        formatTime: (s: number) => string;
        toPlaces: (x: DecimalSource, precision: number, maxAccepted: DecimalSource) => string;
        formatSmall: (x: DecimalSource, precision?: number) => string;
        invertOOM: (x: DecimalSource) => Decimal;
    }
}

requestAnimationFrame(async () => {
    await load();

    // Create Vue
    const vue = (window.vue = createApp({
        ...App
    }));
    globalBus.emit("setupVue", vue);
    vue.mount("#app");
    document.title = modInfo.title;

    startGameLoop();
});
