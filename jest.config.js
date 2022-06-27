module.exports = {
    preset: "vite-jest",
    testEnvironment: "jest-environment-jsdom",
    moduleNameMapper: {
        "^./../([^.].*)$": "$1"
    }
};
