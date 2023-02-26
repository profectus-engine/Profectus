import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";
import projInfo from "./src/data/projInfo.json";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                }
            }
        }
    },
    resolve: {
        alias: {
            vue: "vue/dist/vue.esm-bundler.js"
        }
    },
    plugins: [
        vue(),
        vueJsx({
            // options are passed on to @vue/babel-plugin-jsx
        }),
        tsconfigPaths(),
        VitePWA({
            includeAssets: ["Logo.svg", "favicon.ico", "robots.txt", "apple-touch-icon.png"],
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            manifest: {
                name: projInfo.title,
                short_name: projInfo.title,
                description: projInfo.description,
                theme_color: "#2E3440",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png"
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ]
            }
        })
    ]
});
