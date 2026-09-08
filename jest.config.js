module.exports = {
  preset: '@react-native/jest-preset',
  // The RN preset's own transformIgnorePatterns only allowlists react-native itself, so any other
  // package that ships an untranspiled ESM build (react-redux, @react-native-async-storage's jest
  // mock) fails to parse under Jest. Extend rather than replace it.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|react-redux)/)',
  ],
};
