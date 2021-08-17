module.exports = {
    publicPath: process.env.NODE_ENV === "production" ? "/The-Modding-Tree-X" : "/",
    runtimeCompiler: true,
    chainWebpack(config) {
        config.resolve.alias.delete("@");
        config.resolve
            .plugin("tsconfig-paths")
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            .use(require("tsconfig-paths-webpack-plugin"));
    }
};
