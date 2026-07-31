#import "PreellyDependencyProvider.h"

#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <React/RCTComponentViewProtocol.h>

@interface PreellyDependencyProvider : RCTAppDependencyProvider
@end

@implementation PreellyDependencyProvider

- (nonnull NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  NSMutableDictionary<NSString *, Class<RCTComponentViewProtocol>> *components =
      [[super thirdPartyFabricComponents] mutableCopy];
  if (components == nil) {
    components = [NSMutableDictionary new];
  }

  // Names must match react-native-maps/ios/generated/RCTThirdPartyComponentsProvider.mm
  NSDictionary<NSString *, NSString *> *mapsComponentClassNames = @{
    @"RNMapsGoogleMapView" : @"RNMapsGoogleMapView",
    @"RNMapsGooglePolygon" : @"RNMapsGooglePolygonView",
    @"RNMapsGoogleMarker" : @"RNMapsGoogleMarkerView",
    @"RNMapsMapView" : @"RNMapsMapView",
    @"RNMapsMarker" : @"RNMapsMarkerView",
    @"RNMapsPolygon" : @"RNMapsPolygonView",
  };

  [mapsComponentClassNames enumerateKeysAndObjectsUsingBlock:^(
                               NSString *componentName, NSString *className, BOOL *stop) {
    Class cls = NSClassFromString(className);
    if (cls != Nil) {
      components[componentName] = cls;
    } else {
      NSLog(@"[Preelly] Missing Fabric maps class %@ (component %@)", className, componentName);
    }
  }];

  return components;
}

@end

extern "C" id PreellyCreateDependencyProvider(void)
{
  return [PreellyDependencyProvider new];
}
