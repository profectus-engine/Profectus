module.exports = {
    presets: ["@vue/cli-plugin-babel/preset", "@babel/preset-typescript"],
    plugins: [
        [
            "module:@jetblack/operator-overloading",
            {
                enabled: true
            }
        ],
        "@vue/babel-plugin-jsx"
    ]
};
