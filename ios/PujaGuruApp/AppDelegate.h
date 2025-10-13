#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h> // ✅ Required for push notification handling
#import <PushKit/PushKit.h>

@interface AppDelegate : RCTAppDelegate <UNUserNotificationCenterDelegate, PKPushRegistryDelegate>

@end
