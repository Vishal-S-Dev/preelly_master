export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'preelly_access_token',
  REFRESH_TOKEN: 'preelly_refresh_token',
  USER_DATA: 'preelly_user_data',
  ONBOARDING_COMPLETED: 'preelly_onboarding_completed',
  THEME_MODE: 'preelly_theme_mode',
  RECENT_SEARCHES: 'preelly_recent_searches',
  DEVICE_PUSH_TOKEN: 'preelly_device_push_token',
  DEVICE_ID: 'preelly_device_id',
} as const;

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  GOOGLE_LOGIN: '/api/auth/google',
  APPLE_LOGIN: '/api/auth/apple',
  FEED: '/api/videos/feed',
  PRODUCTS: '/api/products',
  SEARCH: 'api/v1/web/search',
  CHATS: '/api/chats',
  CHATS_UNREAD_COUNT: '/api/chats/unread-count',
  PRODUCT_COMMENTS: '/api/products',
  COMMENT_LIKE: 'api/comments',
  USER_PROFILE: '/user/profile',
  USER_LISTINGS: '/user/listings',
  USER_SAVED: '/user/saved',
  USER_LIKED: '/user/liked',
  SAVED_SEARCHES: '/api/user/saved-searches',
  DYNAMIC_FORM: '/api/v1/web/dynamic-form',
  CATEGORIES: '/api/categories',
  PROPERTY_CATEGORIES: '/api/v1/web/categories/property-categories',
  CLASSIFIEDS_CATEGORIES: '/api/v1/classifieds/categories',
  USER_FOLLOWERS: '/api/user',
  SEARCH_POPULAR: '/api/v1/web/search/popular',
  SEARCH_SUGGESTIONS: '/api/v1/web/search/suggestions',
  EMIRATES: '/api/v1/web/emirates',
  WEB_FILTERS: '/api/v1/web/filters',
  NOTIFICATIONS: '/api/user/notifications',
  /**
   * Push-notification device token registry — NOT yet implemented on the backend (confirmed
   * absent from the reference API repo). Proposed REST contract, following this app's existing
   * `/api/user/*` convention:
   *   POST   /api/user/device-tokens            { token, platform, deviceId }  → register/upsert
   *   DELETE /api/user/device-tokens/:token                                    → unregister one token
   * Multiple tokens per user are expected (one per installed device), so this must be a
   * token-keyed collection server-side, not a single `user.fcmToken` field.
   */
  DEVICE_TOKENS: '/api/user/device-tokens',
  IDENTITY_VERIFICATION: '/api/user/identity-verification',
  PACKAGES: '/api/v1/web/packages',
  STORAGE_FACILITIES: '/api/v1/web/storage-facilities',
  PAYMENT_INITIATE: '/api/payment/initiate',
  PAYMENT_CHECKOUT_INITIATE: '/api/payment/checkout/initiate',
  PAYMENT_CALLBACK: '/api/payment/ccavenue/callback',
  /** List endpoint: GET /api/payment/transactions (plural — not a typo, differs from the singular detail route below). */
  PAYMENT_TRANSACTIONS: '/api/payment/transactions',
  /** Single-transaction detail: GET /api/payment/transaction/:orderId (singular). */
  PAYMENT_TRANSACTION: '/api/payment/transaction',
  /** Invoice download: GET /api/payment/invoice/:orderId (top-level path, not nested under transaction). */
  PAYMENT_INVOICE: '/api/payment/invoice',
  CART: '/api/cart',
  CART_ADD_FROM_OFFER: '/api/cart/from-offer',
  CART_PREELLY_CONDITIONS: '/api/cart/preelly-conditions',
  CART_PREELLY_NOT_INTERESTED: '/api/cart/preelly-not-interested',
  CHECKOUT_SERVICES: '/api/v1/web/checkout-services',
  BUYER_COUPON_VALIDATE: '/api/buyer-coupon/validate',
} as const;

export const PAGINATION = {
  INITIAL_PAGE: 1,
  LIMIT: 10,
} as const;
