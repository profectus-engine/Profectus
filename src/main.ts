import "@fontsource/material-icons";
import App from "App.vue";
import projInfo from "data/projInfo.json";
import "game/notifications";
import { load } from "util/save";
import { useRegisterSW } from "virtual:pwa-register/vue";
import type { App as VueApp } from "vue";
import { createApp, nextTick } from "vue";
import { useToast } from "vue-toastification";

declare global {
    /**
     * Augment the window object so the vue app and project info can be accessed from the console.
     */
    interface Window {
        vue: VueApp;
        projInfo: typeof projInfo;
    }

    /** Fix for typedoc treating import functions as taking AssertOptions instead of GlobOptions. */
    interface AssertOptions {
        as: string;
    }
}

document.title = projInfo.title;
window.projInfo = projInfo;
if (projInfo.id === "") {
    throw "Project ID is empty! Please select a unique ID for this project in /src/data/projInfo.json";
}

requestAnimationFrame(async () => {
    console.log(
        "%cMade in Profectus%c\nLearn more at www.moddingtree.com",
        "font-weight: bold; font-size: 24px; color: #A3BE8C; background: #2E3440; padding: 4px 8px; border-radius: 8px;",
        "padding: 4px;"
    );
    await load();
    const { globalBus } = await import("./game/events");
    const { startGameLoop } = await import("./game/gameLoop");

    // Create Vue
    const vue = (window.vue = createApp(App));
    globalBus.emit("setupVue", vue);
    vue.mount("#app");

    // Setup PWA update prompt
    nextTick(() => {
        const toast = useToast();
        const { updateServiceWorker } = useRegisterSW({
            onNeedRefresh() {
                toast.info("New content available, click here to update.", {
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
                    // https://stackoverflow.com/questions/65500916/typeerror-failed-to-execute-update-on-serviceworkerregistration-illegal-in
                    setInterval(() => r.update(), 60 * 60 * 1000);
                }
            }
        });
    });

    startGameLoop();
});
