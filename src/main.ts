import App from "App.vue";
import projInfo from "data/projInfo.json";
import type { GenericLayer } from "game/layers";
import "game/notifications";
import type { PlayerData } from "game/player";
import type { Settings } from "game/settings";
import type { Transient } from "game/state";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { load } from "util/save";
import { useRegisterSW } from "virtual:pwa-register/vue";
import type { App as VueApp } from "vue";
import { createApp, nextTick } from "vue";
import { useToast } from "vue-toastification";

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
    const { globalBus, startGameLoop } = await import("./game/events");

    // Create Vue
    const vue = (window.vue = createApp(App));
    globalBus.emit("setupVue", vue);
    vue.mount("#app");

    // Setup PWA update prompt
    nextTick(() => {
        const toast = useToast();
        const { updateServiceWorker } = useRegisterSW({
            onNeedRefresh() {
                toast.info("New content available, click or reload to update.", {
                    timeout: false,
                    closeOnClick: false,
                    draggable: false,
                    icon: {
                        iconClass: "material-icons",
                        iconChildren: "refresh",
                        iconTag: "i"
                    },
                    rtl: false,
                    onClick() {
                        updateServiceWorker();
                    }
                });
            },
            onOfflineReady() {
                toast.info("App ready to work offline");
            },
            onRegisterError: console.warn,
            onRegistered(r) {
                if (r) {
                    setInterval(r.update, 60 * 60 * 1000);
                }
            }
        });
    });

    startGameLoop();
});

window.projInfo = projInfo;
