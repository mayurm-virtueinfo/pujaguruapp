#import "AppDelegate.h"
#import "RNSplashScreen.h" // Import RNSplashScreen

#import <React/RCTBundleURLProvider.h>
#import <Firebase.h>
#import "RNFBMessagingModule.h"
#import <UserNotifications/UserNotifications.h>
#import <PushKit/PushKit.h>
@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  
  self.moduleName = @"PujaGuruApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [FIRApp configure];
  NSLog(@"FIRApp default: %@", [FIRApp defaultApp]); // should not be nil
  [[UNUserNotificationCenter currentNotificationCenter] setDelegate:self];
  [application registerForRemoteNotifications];
  // Register for VoIP pushes
  PKPushRegistry *voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  voipRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
  voipRegistry.delegate = self;

  BOOL didFinishLaunching = [super application:application didFinishLaunchingWithOptions:launchOptions];
  [RNSplashScreen show]; // Show splash screen
  return didFinishLaunching;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Called when APNs has assigned the device a unique token
- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [FIRMessaging messaging].APNSToken = deviceToken;
}

// PushKit delegates
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // TODO: send credentials.token to your server for VoIP pushes
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  // Notify JS side (react-native-voip-push-notification listens for this)
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RNVoipPushNotificationReceive" object:payload.dictionaryPayload];
  completion();
}

@end
