module.exports = {
    presets: ["@vue/cli-plugin-babel/preset"],
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
