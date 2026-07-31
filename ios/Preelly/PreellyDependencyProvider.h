#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Creates the app dependency provider with react-native-maps Fabric views registered.
 * Keep this header free of React/C++ imports so the Swift bridging header stays ObjC-safe.
 */
#ifdef __cplusplus
extern "C" {
#endif

id PreellyCreateDependencyProvider(void);

#ifdef __cplusplus
}
#endif

NS_ASSUME_NONNULL_END
