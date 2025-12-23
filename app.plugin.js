// This file is the entry point for the Expo config plugin
// It loads the compiled TypeScript plugin from plugin/build

let plugin;

try {
  // Try to load the compiled plugin
  plugin = require('./plugin/build');
} catch (e) {
  // If the plugin hasn't been built yet, throw a helpful error
  throw new Error(
    'The react-native-smart-camera plugin has not been built yet. ' +
    'Please run `npm run build` in the plugin directory first.'
  );
}

module.exports = plugin.default ?? plugin;
