export interface AppTheme {
  background: string;
  screenGradient: string[];
  card: string;
  text: string;
  subText: string;
  primary: string;
  danger: string;
  pillBg: string;
}

export const lightTheme: AppTheme = {
  background: '#FFFFFF',
  card: '#F4F6F8',
  pillBg: '#E9EEFF',
  text: '#0F172A',
  subText: '#64748B',
  primary: '#0000FF',
  danger: '#EF4444',
  screenGradient: ['#0B1020', '#111827'],
};

export const darkTheme: AppTheme = {
  background: '#0B1020',
  card: '#151D33',
  pillBg: '#E9EEFF',
  text: '#F8FAFC',
  subText: '#94A3B8',
  primary: '#9c9cff',
  danger: '#F87171',
  screenGradient: ['#0B1020', '#111827'],
};
