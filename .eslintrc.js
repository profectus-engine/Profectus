require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        "plugin:vue/vue3-essential",
        "@vue/eslint-config-typescript/recommended",
        "@vue/eslint-config-prettier"
    ],
    parserOptions: {
        ecmaVersion: 2020
    },
    ignorePatterns: ["src/lib"],
    rules: {
        "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
        "vue/script-setup-uses-vars": "warn",
        "vue/no-mutating-props": "off",
        "vue/multi-word-component-names": "off"
    },
    globals: {
        defineProps: "readonly",
        defineEmits: "readonly"
    }
};
