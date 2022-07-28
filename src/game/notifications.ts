import { globalBus } from "game/events";
import { convertComputable } from "util/computed";
import { trackHover, VueFeature } from "util/vue";
import { nextTick, Ref } from "vue";
import { ref, watch } from "vue";
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

/** Utility function to call {@link getNotifyStyle} with "high importance" parameters. */
export function getHighNotifyStyle() {
    return getNotifyStyle("red", "20px");
}

/**
 * Create a boolean ref that will automatically be set based on the given condition, but also dismissed when hovering over a given element, typically the element where acting upon the notification would take place.
 * @param element The element that will dismiss the notification on hover.
 * @param shouldNotify A function or ref that determines if the notif should be active currently or not.
 */
export function createDismissableNotify(
    element: VueFeature,
    shouldNotify: Ref<boolean> | (() => boolean)
): Ref<boolean> {
    const processedShouldNotify = convertComputable(shouldNotify) as Ref<boolean>;
    const notifying = ref(false);
    nextTick(() => {
        notifying.value = processedShouldNotify.value;

        watch(trackHover(element), hovering => {
            if (!hovering) {
                notifying.value = false;
            }
        });
        watch(processedShouldNotify, shouldNotify => {
            notifying.value = shouldNotify;
        });
    });
    return notifying;
}
