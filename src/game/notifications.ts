import { globalBus } from "game/events";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

globalBus.on("setupVue", vue => vue.use(Toast));

/**
 * Gives a {@link CSSProperties} object that makes an object glow, to bring focus to it.
 * Default values are for a "soft" white notif effect.
 * @param color The color of the glow effect.
 * @param strength The strength of the glow effect - affects its spread.
 */
export function getNotifyStyle(color = "white", strength = "8px") {
    return {
        transform: "scale(1.05, 1.05)",
        borderColor: "rgba(0, 0, 0, 0.125)",
        boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 ${strength} ${color}`,
        zIndex: 1
    };
}

/** Utility function to call {@link getNotifyStyle} with "high importance" parameters */
export function getHighNotifyStyle() {
    return getNotifyStyle("red", "20px");
}
