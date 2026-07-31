module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'],
  dependencies: {
    // Autolink Android normally.
    // iOS: disable default Maps-only autolink; Podfile installs react-native-maps/Google.
    // New Architecture Fabric views are registered in PreellyDependencyProvider
    // (autolink skip would otherwise cause "Unimplemented component: <RNMapsGoogleMapView>").
    'react-native-maps': {
      platforms: {
        ios: null,
      },
    },
  },
};
