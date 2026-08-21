import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // @react-native-firebase/app's automatic Objective-C `+load` configuration doesn't reliably
    // fire with this RN template's Swift `@main` / RCTReactNativeFactory app delegate — Firebase
    // itself logs "The default Firebase app has not yet been configured" without this explicit
    // call, which then makes every JS-side getMessaging()/getApp() call throw.
    FirebaseApp.configure()

    // Initialize Google Maps SDK before any MapView mounts (required for provider=google on iOS).
    PreellyConfigureGoogleMaps()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    // Registers RNMaps* Fabric components (autolinking disabled for Google subspec).
    delegate.dependencyProvider = PreellyCreateDependencyProvider() as! any RCTDependencyProvider

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Preelly",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
