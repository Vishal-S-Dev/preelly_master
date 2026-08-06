import { FaqItem, InfoPageConfig, InfoPageKey } from '../types/infoPage.types';

/** Mirrors web's DashboardInfoPage.jsx PAGES object — static content, no backend. */
export const INFO_PAGES: Record<InfoPageKey, InfoPageConfig> = {
  support: {
    title: 'Support',
    description: 'Get help with your Preelly account, listings, and orders.',
    icon: 'lifebuoy',
    body: [
      'Our support team can help with account access, verification, payments, and listing issues.',
      'For fastest help, include your registered email and a short description of the problem.',
    ],
    actions: [
      { label: 'Email Support', icon: 'email-outline', kind: 'mail', value: 'support@preelly.com' },
      { label: 'Open Chat', icon: 'message-text-outline', kind: 'chat' },
    ],
  },
  contact: {
    title: 'Contact Us',
    description: 'Reach the Preelly team directly.',
    icon: 'phone-outline',
    body: [
      'We typically respond within 1 business day.',
      'Prefer chat for active order or listing questions, and email for account or legal requests.',
    ],
    actions: [
      { label: 'support@preelly.com', icon: 'email-outline', kind: 'mail', value: 'support@preelly.com' },
      { label: 'Chat with us', icon: 'message-text-outline', kind: 'chat' },
    ],
  },
};

/** Mirrors web's DashboardInfoPage.jsx PAGES.faq.faqs. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I verify my account?',
    answer:
      'Go to My Profile or Privacy & Security and complete OTP verification, then submit your Emirates ID for identity verification.',
  },
  {
    question: 'How do I post an ad?',
    answer: 'Use the Post Your Ad button in the sidebar, choose a category, add photos/details, and publish.',
  },
  {
    question: 'How do I manage my addresses and bank details?',
    answer: 'Open My Profile to add, edit, or set a primary address, bank account, or saved card.',
  },
  {
    question: 'How do I block someone?',
    answer: 'Open a chat, tap More, then Block. You can unblock them later from Blocked Users.',
  },
];
