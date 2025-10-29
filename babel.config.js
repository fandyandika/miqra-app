module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", {
        jsxImportSource: "nativewind",
        lazyImports: true,
        native: {
          unstable_transformProfile: "hermes-stable",
        },
      }],
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
