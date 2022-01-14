import { globalBus } from "@/game/events";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

globalBus.on("setupVue", vue => vue.use(Toast));
