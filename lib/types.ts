export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  balance: number;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

// User-facing labels keep provider infrastructure details private.
export const PROVIDER_DISPLAY_NAMES = {
  smspool: 'Atlas',
  textverified: 'Lumen',
} as const;

export interface VerificationOrder {
  id: string;
  userId: string;
  service: string;
  country: string;
  phoneNumber: string;
  code: string;
  status: 'pending' | 'waiting_for_code' | 'completed' | 'expired' | 'cancelled' | 'refunded';
  type: 'sms';
  cost: number;
  smspoolOrderId: string;
  provider: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export type ProxyOrderStatus = 'pending' | 'active' | 'failed' | 'expired' | 'cancelled';

export interface ProxyPackage {
  id: number;
  name: string;
  bandwidthGb: number;
  price: number;
  displayPrice: number;
  ratePerGb: number;
  lengthDays: number;
  features: string[];
  extendable: boolean;
  extensionDays: number;
}

export interface ProxyOrder {
  id: string;
  userId: string;
  providerIdentifier: string | null;
  packageId: number;
  packageName: string;
  bandwidthGb: number;
  cost: number;
  status: ProxyOrderStatus;
  createdAt: string;
  expiresAt: string | null;
}

export interface RentalNumber {
  id: string;
  userId: string;
  phoneNumber: string;
  country: string;
  service: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  plan: RentalPlan;
  cost: number;
  provider: 'textverified' | 'smspool';
  providerRentalId: string;
  serviceScope: 'specific' | 'all';
  isRenewable: boolean;
  numberType: 'mobile';
  capability: 'sms';
  alwaysOn: boolean;
  areaCodes: string[];
  billingCycleId: string | null;
  startedAt: string;
  expiresAt: string;
  renewedAt: string | null;
}

export type ThemeMode = 'light' | 'dark';
export type PlanTier = 'weekly' | 'monthly' | 'quarterly' | 'biannual';

export type TextVerifiedRentalDuration =
  | 'oneDay'
  | 'threeDay'
  | 'sevenDay'
  | 'fourteenDay'
  | 'thirtyDay'
  | 'ninetyDay'
  | 'oneYear';

export type RentalPlan = PlanTier | TextVerifiedRentalDuration;

export interface TextVerifiedRentalDurationOption {
  value: TextVerifiedRentalDuration;
  label: string;
  days: number;
  renewable: boolean;
}

export const TEXTVERIFIED_RENTAL_DURATIONS: TextVerifiedRentalDurationOption[] = [
  { value: 'oneDay', label: '1 day', days: 1, renewable: false },
  { value: 'threeDay', label: '3 days', days: 3, renewable: false },
  { value: 'sevenDay', label: '7 days', days: 7, renewable: false },
  { value: 'fourteenDay', label: '14 days', days: 14, renewable: false },
  { value: 'thirtyDay', label: '30 days', days: 30, renewable: true },
  { value: 'ninetyDay', label: '90 days', days: 90, renewable: true },
  { value: 'oneYear', label: '1 year', days: 365, renewable: true },
];

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
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'BR', name: 'Brazil' },
];
