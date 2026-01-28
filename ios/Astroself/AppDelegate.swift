import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseMessaging
import UserNotifications
// import GoogleMaps   // ✅ import

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    
    // Set Firebase Messaging delegate
    Messaging.messaging().delegate = self
    
    // Configure notification center
    UNUserNotificationCenter.current().delegate = self
    
    // Request notification permission and register for remote notifications
    // This must happen early so React Native Firebase can register the device
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if granted {
        print("✅ Notification permission granted")
        DispatchQueue.main.async {
          // Register for APNs remote notifications
          // This is required before React Native Firebase can register the device
          application.registerForRemoteNotifications()
          print("✅ Registered for APNs remote notifications")
        }
      } else {
        print("❌ Notification permission denied: \(error?.localizedDescription ?? "Unknown error")")
      }
    }
    
    // ✅ Initialize Google Maps SDK
    // GMSServices.provideAPIKey("AIzaSyBf3BQDu8L1GbFW1Oj7wpJtl-ybs-WLL-k")

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Astroself",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // Handle notification when app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.alert, .sound, .badge])
  }
  
  // Handle notification tap
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    completionHandler()
  }
  
  // Handle APNs token registration
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    print("APNs token registered: \(deviceToken)")
    // Set APNs token for Firebase Messaging
    Messaging.messaging().apnsToken = deviceToken
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
  }
  
  // MARK: - MessagingDelegate
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("Firebase registration token: \(String(describing: fcmToken))")
    
    let dataDict: [String: String] = ["token": fcmToken ?? ""]
    NotificationCenter.default.post(
      name: Notification.Name("FCMToken"),
      object: nil,
      userInfo: dataDict
    )
  }
  
  // MARK: - Razorpay URL Handling
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // Handle Razorpay URL callbacks
    // The react-native-razorpay module automatically handles URL callbacks
    // through the React Native bridge when the URL scheme is registered in Info.plist
    // We just need to return true to indicate the URL was handled
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
