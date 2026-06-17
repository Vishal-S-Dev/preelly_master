export interface CountryDialCode {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: CountryDialCode[] = [
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { iso: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { iso: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { iso: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { iso: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { iso: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { iso: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { iso: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { iso: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { iso: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { iso: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { iso: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { iso: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { iso: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { iso: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { iso: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { iso: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { iso: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { iso: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { iso: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { iso: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { iso: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { iso: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { iso: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
];

export const DEFAULT_COUNTRY_DIAL_CODE = COUNTRIES[0];

export const COUNTRY_DIAL_CODES = COUNTRIES;
