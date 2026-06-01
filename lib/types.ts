export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredUser extends User {
  password?: string;
}

export interface VerificationOrder {
  id: string;
  userId: string;
  service: string;
  country: string;
  phoneNumber: string;
  code: string;
  status: 'pending' | 'waiting_for_code' | 'completed' | 'expired' | 'cancelled' | 'refunded';
  type: 'sms' | 'voice';
  cost: number;
  smspoolOrderId: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface RentalNumber {
  id: string;
  userId: string;
  phoneNumber: string;
  country: string;
  service: string;
  status: 'active' | 'expired' | 'cancelled';
  plan: 'weekly' | 'monthly' | 'quarterly' | 'biannual';
  cost: number;
  smspoolRentalId: string;
  startedAt: string;
  expiresAt: string;
  renewedAt: string | null;
}

export type ThemeMode = 'light' | 'dark';
export type PlanTier = 'weekly' | 'monthly' | 'quarterly' | 'biannual';

export const PLAN_DURATIONS: Record<PlanTier, { days: number; label: string; discount: number }> = {
  weekly: { days: 7, label: 'Weekly', discount: 0 },
  monthly: { days: 30, label: '1 Month', discount: 10 },
  quarterly: { days: 90, label: '3 Months', discount: 20 },
  biannual: { days: 180, label: '6 Months', discount: 35 },
};

export const SUPPORTED_SERVICES = [
  { id: 'google', name: 'Google' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'discord', name: 'Discord' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'apple', name: 'Apple' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'tinder', name: 'Tinder' },
  { id: 'snapchat', name: 'Snapchat' },
];

export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'BR', name: '🇧🇷 Brazil' },
];
