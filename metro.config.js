const { getDefaultConfig } = require("expo/metro-config");
const nativewind = require("nativewind/metro");
const withNativewind = nativewind.withNativeWind ?? nativewind;

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, { input: "./global.css" });
