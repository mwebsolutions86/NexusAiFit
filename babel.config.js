module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // ✅ IL DOIT ÊTRE ICI, DANS LE RETURN
    ],
  };
};