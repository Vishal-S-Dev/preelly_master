import { OnboardingSlideModel } from './onboarding.types';

export const ONBOARDING_SLIDES: OnboardingSlideModel[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your\nMarketplace',
    description:
      'Discover amazing products and connect with sellers from around the world.',
    gradient: ['#7C3AED', '#2563EB'],
    icon: 'shopping-outline',
  },
  {
    id: 'buy-sell-watch',
    title: 'Buy, Sell, Watch',
    description:
      'Browse listings, sell your items, and track your favorite products effortlessly.',
    gradient: ['#9333EA', '#EC4899'],
    icon: 'trending-up',
  },
  {
    id: 'secure-trusted',
    title: 'Secure & Trusted',
    description:
      'Your transactions are protected with bank-level security and verified sellers.',
    gradient: ['#2563EB', '#06B6D4'],
    icon: 'shield-check-outline',
  },
  {
    id: 'start-journey',
    title: 'Start Your Journey',
    description:
      'Join thousands of users already buying and selling with confidence.',
    gradient: ['#7C3AED', '#8B5CF6'],
    icon: 'star-four-points-outline',
  },
];
