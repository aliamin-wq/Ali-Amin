import { EventDetails, Guest } from '../types/invitation';

export const INITIAL_EVENT: EventDetails = {
  id: 'evt-2026-wedding',
  title: 'حفل زفاف مبارك',
  subtitle: 'يتشرف عبد الرحمن وعائلته بدعوتكم لمشاركتهم فرحتهم الكبرى',
  hostName: 'آل التميمي & آل المنصور',
  dateGregorian: 'الخميس 12 نوفمبر 2026 م',
  dateHijri: '3 جمادى الأولى 1448 هـ',
  timeString: 'الساعة 08:30 مساءً',
  venueName: 'قصر الثريا الملكي للاحتفالات والمؤتمرات',
  venueCity: 'الرياض',
  venueAddress: 'قاعة الملوك الكبرى - طريق الملك فهد',
  dressCode: 'الزي الرسمي السعودي / ثوب وبشت',
  welcomeMessage: 'حضوركم يكتمل به أنسنا ويسعد به لقاؤنا، ونسأل الله أن يديم أفراحكم وأفراحنا بكل خير وبركة.',
  strictCapacityNotice: 'نرجو التكرم بالالتزام بالعدد المخصص في بطاقة الدعوة حرصاً على راحتكم وتنظيم المقاعد.',
  theme: 'emerald_gold',
  hostWhatsAppNumber: '9647873339946',
  autoNotifyHostOnEntry: true,
  totalSeats: 300,
};

export const INITIAL_GUESTS: Guest[] = [
  {
    id: 'G-101',
    code: '7412',
    name: 'الشيخ عبد الله بن ناصر التميمي',
    category: 'vip',
    phone: '+966 50 123 4567',
    maxSeats: 4,
    enteredSeats: 0,
    adultsAllowed: 3,
    adultsEntered: 0,
    childrenAllowed: 1,
    childrenEntered: 0,
    rejectedAttempts: 0,
    status: 'not_arrived',
    notes: 'طاولة كبار الشخصيات رقم 1 (3 بالغين + 1 طفل)',
    invitationUrlToken: 'inv_g101_7412',
    checkInHistory: [],
  },
  {
    id: 'G-102',
    code: '3890',
    name: 'د. محمد فاروق السالم ومرافقيه',
    category: 'friends',
    phone: '+966 55 987 6543',
    maxSeats: 3,
    enteredSeats: 1,
    adultsAllowed: 2,
    adultsEntered: 1,
    childrenAllowed: 1,
    childrenEntered: 0,
    rejectedAttempts: 0,
    status: 'partially_arrived',
    notes: 'حضر البالغ الأول (د. محمد) والمتبقي بالغ وطفل',
    invitationUrlToken: 'inv_g102_3890',
    checkInHistory: [
      {
        id: 'log-102-1',
        timestamp: '08:15 م',
        enteredCount: 1,
        adultsEntered: 1,
        childrenEntered: 0,
        totalAllowed: 3,
        remainingAfter: 2,
        guardNotes: 'دخول الضيف الرئيسي (بالغ واحد)',
      },
    ],
  },
  {
    id: 'G-103',
    code: '5261',
    name: 'م. طارق بن عبد العزيز الكردي وأسرته',
    category: 'family_groom',
    phone: '+966 54 222 3344',
    maxSeats: 999,
    enteredSeats: 4,
    adultsAllowed: 999,
    adultsEntered: 3,
    childrenAllowed: 999,
    childrenEntered: 1,
    rejectedAttempts: 0,
    isUnlimited: true,
    status: 'partially_arrived',
    notes: 'عائلة العريس - ميزانية ودخول مفتوح للبالغين والأطفال دون تقيد بأرقام',
    invitationUrlToken: 'inv_g103_5261',
    checkInHistory: [
      {
        id: 'log-103-1',
        timestamp: '07:50 م',
        enteredCount: 4,
        adultsEntered: 3,
        childrenEntered: 1,
        totalAllowed: 999,
        remainingAfter: 999,
        guardNotes: 'دخول أسرة العريس الكريمة (3 بالغين + 1 طفل - سعة مفتوحة)',
      },
    ],
  },
  {
    id: 'G-104',
    code: '8145',
    name: 'الأستاذ فيصل بن حمد المنصور وعائلته',
    category: 'family_bride',
    phone: '+966 56 444 8899',
    maxSeats: 999,
    enteredSeats: 0,
    adultsAllowed: 999,
    adultsEntered: 0,
    childrenAllowed: 999,
    childrenEntered: 0,
    rejectedAttempts: 0,
    isUnlimited: true,
    status: 'not_arrived',
    notes: 'عائلة العروس - ميزانية ودخول مفتوح للبالغين والأطفال دون تقيد بأرقام',
    invitationUrlToken: 'inv_g104_8145',
    checkInHistory: [],
  },
  {
    id: 'G-105',
    code: '9033',
    name: 'سعادة الأستاذ بندر بن فهد الهاشمي',
    category: 'vip',
    phone: '+966 50 777 9900',
    maxSeats: 5,
    enteredSeats: 0,
    adultsAllowed: 3,
    adultsEntered: 0,
    childrenAllowed: 2,
    childrenEntered: 0,
    rejectedAttempts: 0,
    status: 'not_arrived',
    notes: 'عائلة الهاشمي - جناح الضيوف أ (3 بالغين + 2 أطفال)',
    invitationUrlToken: 'inv_g105_9033',
    checkInHistory: [],
  },
  {
    id: 'G-106',
    code: '2174',
    name: 'الأستاذ سلطان الشمري وأسرته',
    category: 'general',
    phone: '+966 53 111 6655',
    maxSeats: 2,
    enteredSeats: 2,
    adultsAllowed: 2,
    adultsEntered: 2,
    childrenAllowed: 0,
    childrenEntered: 0,
    rejectedAttempts: 0,
    status: 'fully_arrived',
    notes: 'تم الدخول بالكامل (شخصين بالغين)',
    invitationUrlToken: 'inv_g106_2174',
    checkInHistory: [
      {
        id: 'log-106-1',
        timestamp: '08:05 م',
        enteredCount: 2,
        adultsEntered: 2,
        childrenEntered: 0,
        totalAllowed: 2,
        remainingAfter: 0,
        guardNotes: 'دخول شخصين بالغين - اكتملت الطاقة الاستيعابية',
      },
    ],
  },
];

const STORAGE_KEYS = {
  EVENT: 'smart_invitation_event_data_v1',
  GUESTS: 'smart_invitation_guests_data_v1',
};

export function loadEventDetails(): EventDetails {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_EVENT,
        ...parsed,
        hostWhatsAppNumber: parsed.hostWhatsAppNumber || '9647873339946',
        autoNotifyHostOnEntry: parsed.autoNotifyHostOnEntry ?? true,
        totalSeats: parsed.totalSeats ? Number(parsed.totalSeats) : 300,
      };
    }
  } catch (e) {
    console.warn('Failed to load event from storage', e);
  }
  return INITIAL_EVENT;
}

export function saveEventDetails(event: EventDetails): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(event));
  } catch (e) {
    console.warn('Failed to save event to storage', e);
  }
}

export function loadGuests(): Guest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GUESTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: Partial<Guest>) => {
          const isUnlimited = Boolean(
            g.isUnlimited ||
            g.category === 'family_groom' ||
            g.category === 'family_bride'
          );
          const maxSeats = g.maxSeats ?? 1;
          const enteredSeats = g.enteredSeats ?? 0;
          const adultsAllowed = isUnlimited ? 999 : (g.adultsAllowed ?? maxSeats);
          const adultsEntered = g.adultsEntered ?? (g.childrenAllowed ? Math.max(0, enteredSeats - (g.childrenEntered ?? 0)) : enteredSeats);
          const childrenAllowed = isUnlimited ? 999 : (g.childrenAllowed ?? 0);
          const childrenEntered = g.childrenEntered ?? 0;

          return {
            ...g,
            isUnlimited,
            maxSeats: isUnlimited ? 999 : (adultsAllowed + childrenAllowed),
            enteredSeats: adultsEntered + childrenEntered,
            adultsAllowed,
            adultsEntered,
            childrenAllowed,
            childrenEntered,
            rejectedAttempts: g.rejectedAttempts ?? 0,
            checkInHistory: g.checkInHistory ?? [],
          } as Guest;
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load guests from storage', e);
  }
  return INITIAL_GUESTS;
}

export function saveGuests(guests: Guest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  } catch (e) {
    console.warn('Failed to save guests to storage', e);
  }
}

