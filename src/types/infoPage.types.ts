export type InfoPageKey = 'support' | 'contact';

export interface InfoPageAction {
  label: string;
  icon: string;
  kind: 'mail' | 'chat';
  value?: string;
}

export interface InfoPageConfig {
  title: string;
  description: string;
  icon: string;
  body: string[];
  actions: InfoPageAction[];
}

export interface FaqItem {
  question: string;
  answer: string;
}
