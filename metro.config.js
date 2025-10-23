const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite
config.resolver.assetExts.push('wasm');

// Add @ alias support
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = withNativeWind(config, { input: './global.css' });
