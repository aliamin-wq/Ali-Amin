export type GuestCategory = 'vip' | 'family_groom' | 'family_bride' | 'friends' | 'general';

export interface CheckInLog {
  id: string;
  timestamp: string;
  enteredCount: number;
  adultsEntered?: number;
  childrenEntered?: number;
  totalAllowed: number;
  remainingAfter: number;
  guardNotes?: string;
  isRejectedAttempt?: boolean;
}

export interface Guest {
  id: string; // e.g. "G-101"
  code: string; // 4-digit code e.g. "4821"
  name: string;
  category: GuestCategory;
  phone?: string;
  maxSeats: number; // العدد المسموح به إجمالاً (البالغين + الأطفال)
  enteredSeats: number; // الداخلون حتى الآن
  adultsAllowed: number; // عدد البالغين المسموح به
  adultsEntered: number; // عدد البالغين الذين دخلوا
  childrenAllowed: number; // عدد الأطفال المسموح به
  childrenEntered: number; // عدد الأطفال الذين دخلوا
  rejectedAttempts?: number; // عدد محاولات الدخول التي تم رفضها بسبب تجاوز العدد
  status: 'not_arrived' | 'partially_arrived' | 'fully_arrived';
  isUnlimited?: boolean; // عائلة العريس أو العروس ميزانية مفتوحة دون تقييد بعدد
  notes?: string;
  checkInHistory: CheckInLog[];
  invitationUrlToken: string;
}

export function isGuestUnlimited(guest?: Guest | null): boolean {
  if (!guest) return false;
  return Boolean(
    guest.isUnlimited ||
    guest.category === 'family_groom' ||
    guest.category === 'family_bride'
  );
}

export function getGuestAdultsRemaining(guest?: Guest | null): number {
  if (!guest) return 0;
  if (isGuestUnlimited(guest)) return 9999;
  const allowed = guest.adultsAllowed ?? guest.maxSeats ?? 1;
  const entered = guest.adultsEntered ?? 0;
  return Math.max(0, allowed - entered);
}

export function getGuestChildrenRemaining(guest?: Guest | null): number {
  if (!guest) return 0;
  if (isGuestUnlimited(guest)) return 9999;
  const allowed = guest.childrenAllowed ?? 0;
  const entered = guest.childrenEntered ?? 0;
  return Math.max(0, allowed - entered);
}

export function getGuestTotalRemaining(guest?: Guest | null): number {
  if (!guest) return 0;
  if (isGuestUnlimited(guest)) return 9999;
  return getGuestAdultsRemaining(guest) + getGuestChildrenRemaining(guest);
}

export interface EventDetails {
  id: string;
  title: string;
  subtitle: string;
  hostName: string;
  dateGregorian: string;
  dateHijri: string;
  timeString: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  dressCode: string;
  welcomeMessage: string;
  strictCapacityNotice: string;
  theme: 'emerald_gold' | 'royal_midnight' | 'classic_gold' | 'ruby_velvet';
  hostWhatsAppNumber: string; // e.g. "9647873339946"
  autoNotifyHostOnEntry: boolean;
  totalSeats: number; // Hall total seats (default: 300)
}

export interface ScanResult {
  guest: Guest;
  status: 'valid' | 'exhausted' | 'exceeded_attempt';
  remainingSeats: number;
}

