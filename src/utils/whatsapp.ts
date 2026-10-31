import { Guest, EventDetails, isGuestUnlimited, getGuestAdultsRemaining, getGuestChildrenRemaining } from '../types/invitation';

export function cleanWhatsAppNumber(phone: string): string {
  // Removes spaces, plus, dashes, leading double zeros (00964 -> 964)
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }
  return clean || '9647873339946';
}

export function buildCheckInWhatsAppMessage(
  guest: Guest,
  enteredNow: number,
  remainingAfter: number,
  timeString: string,
  event: EventDetails,
  guardNote?: string,
  adultsNow?: number,
  childrenNow?: number
): string {
  const noteLine = guardNote ? `\n📝 *ملاحظة الحارس:* ${guardNote}` : '';
  const isUnlimited = isGuestUnlimited(guest);

  const breakdownLine = adultsNow !== undefined || childrenNow !== undefined
    ? `\n👨 *البالغين الذين دخلوا الآن:* (${adultsNow ?? enteredNow})\n🧒 *الأطفال الذين دخلوا الآن:* (${childrenNow ?? 0})`
    : '';

  const capacityInfo = isUnlimited
    ? `👑 *الفئة:* أهل الحفل والكرامة (سعة مفتوحة بدون تقييد بأرقام)\n⏳ *المتبقي:* مفتوح ∞ دائماً`
    : `🪑 *إجمالي مقاعد البطاقة:* (${guest.maxSeats}) [${guest.adultsAllowed} بالغين + ${guest.childrenAllowed} أطفال]\n⏳ *المتبقي بعد هذا الدخول:* (${remainingAfter}) مقاعد [${getGuestAdultsRemaining(guest)} بالغين + ${getGuestChildrenRemaining(guest)} أطفال]`;

  return `🔔 *إشعار دخول ضيف في الحفل*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *اسم المدعو:* ${guest.name}\n` +
    `👥 *إجمالي الداخلين الآن:* (${enteredNow}) شخص` +
    breakdownLine + `\n` +
    capacityInfo + `\n` +
    `🕒 *وقت الدخول:* ${timeString}\n` +
    `🎫 *رمز الدعوة:* #${guest.code} (${guest.id})\n` +
    `🏛️ *القاعة:* ${event.venueName}` +
    noteLine + `\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *تحديث فوري من بوابة الدخول والتحقق الذكية*`;
}

export function buildCheckInWhatsAppUrl(
  guest: Guest,
  enteredNow: number,
  remainingAfter: number,
  timeString: string,
  event: EventDetails,
  guardNote?: string,
  adultsNow?: number,
  childrenNow?: number
): string {
  const number = cleanWhatsAppNumber(event.hostWhatsAppNumber || '9647873339946');
  const message = buildCheckInWhatsAppMessage(
    guest,
    enteredNow,
    remainingAfter,
    timeString,
    event,
    guardNote,
    adultsNow,
    childrenNow
  );
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
}

export function buildSummaryWhatsAppMessage(guests: Guest[], event: EventDetails): string {
  const standardGuests = guests.filter((g) => !isGuestUnlimited(g));
  const familyGuests = guests.filter((g) => isGuestUnlimited(g));

  const totalAdultsAllowed = standardGuests.reduce((sum, g) => sum + (g.adultsAllowed ?? g.maxSeats), 0);
  const totalChildrenAllowed = standardGuests.reduce((sum, g) => sum + (g.childrenAllowed ?? 0), 0);
  const totalStandardAllocated = totalAdultsAllowed + totalChildrenAllowed;

  const totalAdultsEntered = guests.reduce((sum, g) => sum + (g.adultsEntered ?? 0), 0);
  const totalChildrenEntered = guests.reduce((sum, g) => sum + (g.childrenEntered ?? 0), 0);
  const totalEntered = totalAdultsEntered + totalChildrenEntered;

  const remainingAdults = Math.max(0, totalAdultsAllowed - standardGuests.reduce((sum, g) => sum + (g.adultsEntered ?? 0), 0));
  const remainingChildren = Math.max(0, totalChildrenAllowed - standardGuests.reduce((sum, g) => sum + (g.childrenEntered ?? 0), 0));
  const totalRemaining = remainingAdults + remainingChildren;

  const totalRejectedAttempts = guests.reduce((sum, g) => sum + (g.rejectedAttempts ?? 0), 0);

  const percentage = totalStandardAllocated > 0 ? Math.round((standardGuests.reduce((sum, g) => sum + g.enteredSeats, 0) / totalStandardAllocated) * 100) : 0;

  const nowTime = new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  const enteredGuestsList = guests
    .filter((g) => g.enteredSeats > 0)
    .map((g) => {
      if (isGuestUnlimited(g)) {
        return `• 👑 ${g.name} (أهل الحفل): دخل (${g.enteredSeats}) [${g.adultsEntered} بالغين + ${g.childrenEntered} أطفال] - سعة مفتوحة`;
      }
      return `• ${g.name}: دخل (${g.enteredSeats}/${g.maxSeats}) [${g.adultsEntered} بالغين + ${g.childrenEntered} أطفال]`;
    })
    .join('\n');

  return `📊 *تقرير الحضور والإحصائيات الشاملة للحفل*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏛️ *المناسبة:* ${event.title}\n` +
    `🕒 *الوقت:* ${nowTime}\n\n` +
    `📈 *الملخص الإحصائي الكامل:*\n` +
    `• إجمالي الحضور الذين دخلوا: *${totalEntered} شخص*\n` +
    `  ├─ 👨 البالغين: *${totalAdultsEntered} شخص*\n` +
    `  └─ 🧒 الأطفال: *${totalChildrenEntered} طفل*\n\n` +
    `• إجمالي المقاعد المتبقية بالخارج: *${totalRemaining} مقعد*\n` +
    `  ├─ 👨 باقي بالغين: *${remainingAdults} مقعد*\n` +
    `  └─ 🧒 باقي أطفال: *${remainingChildren} مقعد*\n\n` +
    `• إجمالي سعة البطاقات المسجلة: *${totalStandardAllocated} مقعد*\n` +
    `• حضور أهل الحفل (ميزانية مفتوحة): *${familyGuests.reduce((s, g) => s + g.enteredSeats, 0)} شخص*\n` +
    `• محاولات التجاوز المرفوضة التي صُدت: *${totalRejectedAttempts} محاولة*\n` +
    `• نسبة امتلاء المقاعد العامة: *${percentage}%*\n\n` +
    `📋 *سجل الحضور حتى هذه اللحظة:*\n` +
    (enteredGuestsList || '• لم يدخل أحد بعد') + `\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *نظام البوابة الذكية لضبط السعة ومنع التجاوز*`;
}

export function buildSummaryWhatsAppUrl(guests: Guest[], event: EventDetails): string {
  const number = cleanWhatsAppNumber(event.hostWhatsAppNumber || '9647873339946');
  const message = buildSummaryWhatsAppMessage(guests, event);
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
}

