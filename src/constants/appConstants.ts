export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'preelly_access_token',
  REFRESH_TOKEN: 'preelly_refresh_token',
  USER_DATA: 'preelly_user_data',
  ONBOARDING_COMPLETED: 'preelly_onboarding_completed',
  THEME_MODE: 'preelly_theme_mode',
  RECENT_SEARCHES: 'preelly_recent_searches',
} as const;

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  REFRESH_TOKEN: '/api/auth/refresh-token',
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
  DYNAMIC_FORM: '/api/v1/web/dynamic-form',
  CATEGORIES_ROOTS: '/api/categories/roots',
  CATEGORIES: '/api/categories',
  PROPERTY_CATEGORIES: '/api/v1/web/categories/property-categories',
  USER_FOLLOWERS: '/api/user',
  SEARCH_POPULAR: '/api/v1/web/search/popular',
  SEARCH_SUGGESTIONS: '/api/v1/web/search/suggestions',
  EMIRATES: '/api/v1/web/emirates',
  WEB_FILTERS: '/api/v1/web/filters',
} as const;

export const PAGINATION = {
  INITIAL_PAGE: 1,
  LIMIT: 10,
} as const;
