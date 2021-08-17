import { createApp } from "vue";
import App from "./App.vue";
import { load } from "./util/save";
import { setVue } from "./util/vue";
import gameLoop from "./game/gameLoop";
import { registerComponents } from "./components/index";
import modInfo from "./data/modInfo.json";

requestAnimationFrame(async () => {
    await load();

    // Create Vue
    const vue = (window.vue = createApp({
        ...App
    }));
    setVue(vue);
    registerComponents(vue);
    vue.mount("#app");
    document.title = modInfo.title;

    gameLoop();
});
