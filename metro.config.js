const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Metro tries to open files via `cursor` when Cursor is running, but the CLI is often not on PATH.
const cursorBin = '/Applications/Cursor.app/Contents/Resources/app/bin/cursor';
if (!process.env.REACT_EDITOR && fs.existsSync(cursorBin)) {
  process.env.REACT_EDITOR = cursorBin;
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
