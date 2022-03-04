import { globalBus } from "game/events";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

globalBus.on("setupVue", vue => vue.use(Toast));

export function getNotifyStyle(color = "white", strength = "8px") {
    return {
        transform: "scale(1.05, 1.05)",
        borderColor: "rgba(0, 0, 0, 0.125)",
        boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 ${strength} ${color}`,
        zIndex: 1
    };
}

export function getHighNotifyStyle() {
    return getNotifyStyle("red", "20px");
}
