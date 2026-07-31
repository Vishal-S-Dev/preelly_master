#import "GoogleMapsBootstrap.h"

#import <GoogleMaps/GoogleMaps.h>
#import "RNCConfig.h"

void PreellyConfigureGoogleMaps(void) {
  NSString *apiKey = [RNCConfig envFor:@"GOOGLE_MAPS_API_KEY"];
  if (apiKey == nil || apiKey.length == 0) {
    NSLog(@"[Preelly] GOOGLE_MAPS_API_KEY missing — Google Maps tiles will not load on iOS.");
    return;
  }
  [GMSServices provideAPIKey:apiKey];
  NSLog(@"[Preelly] Google Maps SDK configured for iOS.");
}
