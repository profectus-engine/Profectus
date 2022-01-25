module.exports = {
    publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
    runtimeCompiler: true,
    chainWebpack(config) {
        config.resolve.alias.delete("@");
        config.resolve
            .plugin("tsconfig-paths")
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            .use(require("tsconfig-paths-webpack-plugin"));
        // Remove this if/when all "core" code has no non-ignored more type errors
        // https://github.com/vuejs/vue-cli/issues/3157#issuecomment-657090338
        config.plugins.delete("fork-ts-checker");
    },
    devServer: {
        allowedHosts: "all"
    }
};
