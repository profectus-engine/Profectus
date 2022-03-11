import { App as VueApp, createApp } from "vue";
import App from "./App.vue";
import projInfo from "./data/projInfo.json";
import { GenericLayer } from "./game/layers";
import { PlayerData } from "./game/player";
import { Settings } from "./game/settings";
import { Transient } from "./game/state";
import Decimal, { DecimalSource } from "./util/bignum";
import { load } from "./util/save";

document.title = projInfo.title;
if (projInfo.id === "") {
    throw "Project ID is empty! Please select a unique ID for this project in /src/data/projInfo.json";
}

declare global {
    interface Window {
        vue: VueApp;
        save: VoidFunction;
        hardReset: VoidFunction;
        hardResetSettings: VoidFunction;
        layers: Record<string, Readonly<GenericLayer> | undefined>;
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
        projInfo: typeof projInfo;
    }
}

requestAnimationFrame(async () => {
    console.log(
        "%cMade in Profectus%c\nLearn more at www.moddingtree.com",
        "font-weight: bold; font-size: 24px; color: #A3BE8C; background: #2E3440; padding: 4px 8px; border-radius: 8px;",
        "padding: 4px;"
    );
    await load();
    const { globalBus, startGameLoop } = await require("./game/events");

    // Create Vue
    const vue = (window.vue = createApp(App));
    globalBus.emit("setupVue", vue);
    vue.mount("#app");

    startGameLoop();
});

window.projInfo = projInfo;
