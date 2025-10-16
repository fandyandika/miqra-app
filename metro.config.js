const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './global.css' });


