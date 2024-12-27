import "@fontsource/material-icons";
import App from "App.vue";
import projInfo from "data/projInfo.json";
import "game/notifications";
import state from "game/state";
import "util/galaxy";
import { load } from "util/save";
import { useRegisterSW } from "virtual:pwa-register/vue";
import type { App as VueApp } from "vue";
import { createApp, nextTick } from "vue";
import { useToast } from "vue-toastification";
import { globalBus } from "game/events";
import { startGameLoop } from "game/gameLoop";

declare global {
    /**
     * Augment the window object so the vue app and project info can be accessed from the console.
     */
    interface Window {
        vue: VueApp;
        projInfo: typeof projInfo;
    }
}

const error = console.error;
console.error = function (...args) {
    if (import.meta.env.DEV) {
        state.errors.push(new Error(args[0], { cause: args[1] }));
    }
    error(...args);
};

window.onerror = function (event, source, lineno, colno, err) {
    state.errors.push(err instanceof Error ? err : new Error(JSON.stringify(err)));
    error(err);
    return true;
};
window.onunhandledrejection = function (event) {
    state.errors.push(
        event.reason instanceof Error ? event.reason : new Error(JSON.stringify(event.reason))
    );
    error(event.reason);
};

document.title = projInfo.title;
window.projInfo = projInfo;
if (projInfo.id === "") {
    console.error(
        "Project ID is empty!",
        "Please select a unique ID for this project in /src/data/projInfo.json"
    );
}

requestAnimationFrame(async () => {
    console.log(
        "%cMade in Profectus%c\nLearn more at www.moddingtree.com",
        "font-weight: bold; font-size: 24px; color: #A3BE8C; background: #2E3440; padding: 4px 8px; border-radius: 8px;",
        "padding: 4px;"
    );
    await load();

    // Create Vue
    const vue = (window.vue = createApp(App));
    vue.config.errorHandler = function (err, instance, info) {
        console.error(err, info, instance);
    };
    globalBus.emit("setupVue", vue);
    vue.mount("#app");

    // Setup PWA update prompt
    nextTick(() => {
        const toast = useToast();
        useRegisterSW({
            immediate: true,
            onOfflineReady() {
                toast.info("App ready to work offline");
            },
            onRegisterError: console.warn,
            onRegistered: console.info
        });
    });

    startGameLoop();
});
