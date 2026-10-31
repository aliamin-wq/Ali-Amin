import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Printer, 
  Download, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  Smartphone
} from 'lucide-react';
import { Guest, EventDetails, isGuestUnlimited } from '../types/invitation';
import { generateQrCodeDataUrl, generateBarcodePattern } from '../utils/qr';
import { GuestMobilePreviewModal } from './GuestMobilePreviewModal';

interface InvitationCardProps {
  event: EventDetails;
  guest: Guest;
  allGuests: Guest[];
  onSelectGuest: (guestId: string) => void;
  onSimulateGuardScan: (guest: Guest) => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  event,
  guest,
  allGuests,
  onSelectGuest,
  onSimulateGuardScan,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<'emerald' | 'cream' | 'midnight'>('emerald');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);

  // Generate QR Code data URL linking directly to the live website
  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      // Build the direct live web URL with token
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
      const fullTicketUrl = `${baseUrl}?ticket=${guest.invitationUrlToken}`;
      
      const url = await generateQrCodeDataUrl(fullTicketUrl, {
        width: 340,
        darkColor: '#0f172a',
        lightColor: '#ffffff',
      });
      if (isMounted) {
        setQrDataUrl(url);
      }
    };
    generate();
    return () => {
      isMounted = false;
    };
  }, [guest]);

  const barcodePattern = generateBarcodePattern(guest.code + guest.id);
  const isUnlimited = isGuestUnlimited(guest);
  const remainingSeats = isUnlimited ? 9999 : Math.max(0, guest.maxSeats - guest.enteredSeats);

  // WhatsApp share link generator
  const handleWhatsAppShare = () => {
    const seatsLine = isUnlimited
      ? `• السعة المخصصة لكم: *(دعوة شرفية مفتوحة - أهل الحفل)*`
      : `• سعة الدعوة المخصصة لكم: *(${guest.maxSeats}) أشخاص*`;

    const text = `السلام عليكم ورحمة الله وبركاته،\n` +
      `الأخ الكريم: *${guest.name}*\n\n` +
      `يسرنا ويشرفنا دعوتكم لحضور *${event.title}* (${event.hostName})\n` +
      `📅 *التاريخ:* ${event.dateGregorian} (${event.dateHijri})\n` +
      `⏰ *الوقت:* ${event.timeString}\n` +
      `📍 *المكان:* ${event.venueName} - ${event.venueCity}\n\n` +
      `🎫 *بيانات بطاقة الدخول:*\n` +
      `${seatsLine}\n` +
      `• رمز الدخول السريع عند البوابة: *#${guest.code}*\n\n` +
      `⚠️ *تنبيه المنظم:* يرجى إبراز بطاقة الدعوة أو رمز الـ QR عند بوابة الدخول لحساب عدد الضيوف حيث يتم التحقق من المقاعد.\n\n` +
      `أهلاً وسهلاً بكم في أفراحنا.`;

    const encoded = encodeURIComponent(text);
    const phoneClean = guest.phone?.replace(/[^0-9]/g, '') || '';
    const whatsappUrl = phoneClean
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = () => {
    const dummyUrl = `${window.location.origin}/#ticket-${guest.invitationUrlToken}`;
    navigator.clipboard.writeText(dummyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${guest.name.replace(/\s+/g, '_')}-${guest.code}.png`;
    a.click();
  };

  return (
    <div className="space-y-6 printable-card-container">
      {/* Top Controls Bar (hidden during print) */}
      <div className="no-print bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Guest Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 whitespace-nowrap">
            عرض بطاقة المدعو:
          </label>
          <div className="relative flex-1 sm:w-64">
            <select
              value={guest.id}
              onChange={(e) => onSelectGuest(e.target.value)}
              className="w-full text-xs font-bold py-2 pr-3 pl-8 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none appearance-none text-stone-900 dark:text-stone-100"
            >
              {allGuests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.maxSeats} مقاعد - كود: {g.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Theme Chooser */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">طابع الكرت:</span>
          <button
            onClick={() => setSelectedTheme('emerald')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedTheme === 'emerald'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            الزمردي الملكي
          </button>
          <button
            onClick={() => setSelectedTheme('midnight')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedTheme === 'midnight'
                ? 'bg-stone-950 text-amber-300 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            الكحلي الليلي
          </button>
          <button
            onClick={() => setSelectedTheme('cream')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedTheme === 'cream'
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            العاجي الفاخر
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsMobilePreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>معاينة جوال المدعو</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>إرسال واتساب</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>
          <button
            onClick={() => onSimulateGuardScan(guest)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>فحص عند الحارس</span>
          </button>
        </div>
      </div>

      {/* Guest Mobile Frame Modal */}
      <GuestMobilePreviewModal
        guest={guest}
        event={event}
        qrDataUrl={qrDataUrl}
        isOpen={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        onSimulateScan={() => onSimulateGuardScan(guest)}
      />

      {/* THE LUXURY DIGITAL INVITATION CARD CONTAINER */}
      <div className="flex justify-center p-2 sm:p-6">
        <div
          className={`printable-card w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300 relative ${
            selectedTheme === 'emerald'
              ? 'bg-[#0d3326] text-amber-50 border-amber-600/40 shadow-emerald-950/40'
              : selectedTheme === 'midnight'
              ? 'bg-[#0a0f1d] text-amber-100 border-amber-500/30 shadow-indigo-950/50'
              : 'bg-[#faf7f2] text-stone-900 border-amber-200 shadow-stone-300/40'
          }`}
        >
          {/* Subtle Islamic Arch / Floral Border Accent Overlay */}
          <div className="absolute inset-2 sm:inset-3 border border-amber-400/30 rounded-2xl pointer-events-none" />
          <div className="absolute inset-3 sm:inset-4 border border-dashed border-amber-400/20 rounded-xl pointer-events-none" />

          {/* Card Header & Basmala */}
          <div className="pt-8 pb-4 px-6 sm:px-10 text-center relative z-10">
            <div className="text-amber-400/90 font-serif text-lg sm:text-xl tracking-wide mb-3 select-none">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
              دعوة خاصة كريمة
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-black font-serif tracking-tight mb-2 ${
                selectedTheme === 'cream' ? 'text-amber-900' : 'text-amber-100'
              }`}
            >
              {event.title}
            </h1>

            <p
              className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${
                selectedTheme === 'cream' ? 'text-stone-600' : 'text-amber-200/80'
              }`}
            >
              {event.subtitle}
            </p>
          </div>

          {/* Guest Spotlight Card Frame */}
          <div className="mx-6 sm:mx-10 my-2 p-5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center relative z-10 backdrop-blur-xs">
            <span className="text-[11px] text-amber-300/90 font-semibold block mb-1">
              تتشرف الدعوة بحضور المكرم:
            </span>
            <div
              className={`text-xl sm:text-2xl font-black ${
                selectedTheme === 'cream' ? 'text-stone-900' : 'text-white'
              }`}
            >
              {guest.name}
            </div>

            {/* CAPACITY BADGE (CRITICAL TO USER SPECIFICATION) */}
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-sm shadow-md">
              <Users className="w-4 h-4 text-stone-950" />
              <span>
                {isUnlimited
                  ? '👑 أهل الحفل والكرامة - دعوة شرفية مفتوحة (سعة غير محدودة)'
                  : `هذه الدعوة مخصصة لـ (${guest.maxSeats}) أشخاص [${guest.adultsAllowed ?? guest.maxSeats} بالغين • ${guest.childrenAllowed ?? 0} أطفال]`}
              </span>
            </div>

            {/* Live Gate Entry Status Badge */}
            <div className="mt-2 text-xs flex items-center justify-center gap-1.5">
              {isUnlimited ? (
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  صالحة دائماً - دخول مفتوح ومرحب بكم وبضيوفكم
                </span>
              ) : remainingSeats === 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  تم استنفاد المقاعد مسبقاً (داخل القاعة: {guest.enteredSeats})
                </span>
              ) : guest.enteredSeats > 0 ? (
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  دخل ({guest.enteredSeats}) ومتبقي ({remainingSeats}) أشخاص
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  صالحة للدخول بالكامل (متبقي {remainingSeats} مقاعد)
                </span>
              )}
            </div>
          </div>

          {/* Event Details Ribbon (Date, Time, Location) */}
          <div className="px-6 sm:px-10 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs relative z-10">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/15 border border-white/10">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold">{event.dateGregorian}</div>
                <div className="text-[11px] opacity-75">{event.dateHijri}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/15 border border-white/10">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold">{event.timeString}</div>
                <div className="text-[11px] opacity-75">نرجو التكرم بالحضور في الموعد</div>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-black/15 border border-white/10">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold">{event.venueName}</div>
                <div className="text-[11px] opacity-75">{event.venueAddress} - {event.venueCity}</div>
              </div>
            </div>
          </div>

          {/* PASSCODE & BARCODE / QR SECTION */}
          <div className="m-6 sm:m-10 mt-2 p-5 rounded-2xl bg-white text-stone-900 shadow-lg text-center relative z-10 border border-stone-200">
            <div className="text-xs text-stone-500 font-semibold mb-2">
              يرجى إبراز هذا الرمز عند بوابة الدخول لموظف الاستقبال / الحارس
            </div>

            {/* QR Code Graphic */}
            <div className="flex justify-center my-2">
              {qrDataUrl ? (
                <div className="p-2 bg-white rounded-xl border border-stone-300 shadow-xs inline-block">
                  <img
                    src={qrDataUrl}
                    alt="QR Code Ticket"
                    className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-stone-100 rounded-xl flex items-center justify-center text-xs text-stone-400">
                  جارٍ إنشاء الرمز...
                </div>
              )}
            </div>

            {/* 4-Digit Passcode Banner */}
            <div className="my-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200">
              <span className="text-xs text-stone-600 font-medium">رمز الدخول السريع:</span>
              <span className="font-mono font-black text-lg text-amber-700 tracking-widest">
                {guest.code}
              </span>
            </div>

            {/* Classic Barcode Representation Graphic */}
            <div className="mt-3 pt-3 border-t border-stone-100">
              <div className="flex justify-center items-end h-9 gap-[2px] px-4 max-w-xs mx-auto">
                {barcodePattern.map((width, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-900 h-full"
                    style={{ width: `${width * 2}px` }}
                  />
                ))}
              </div>
              <div className="text-[10px] font-mono tracking-widest text-stone-500 mt-1">
                INV-{guest.code}-{guest.id}
              </div>
            </div>
          </div>

          {/* Card Footer notice */}
          <div className="pb-8 px-6 sm:px-10 text-center relative z-10">
            <p className="text-[11px] text-amber-200/70 max-w-md mx-auto leading-relaxed">
              {event.strictCapacityNotice}
            </p>
            <div className="mt-3 text-[10px] text-amber-400/50">
              {event.hostName} · حياكم الله وبياكم
            </div>
          </div>
        </div>
      </div>

      {/* Card Helper Links & Actions */}
      <div className="no-print max-w-xl mx-auto flex flex-wrap items-center justify-center gap-3 text-xs text-stone-600 dark:text-stone-400">
        <button
          onClick={handleDownloadQr}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          <span>تحميل رمز الـ QR (صورة)</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
          <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط بطاقة المدعو'}</span>
        </button>
      </div>
    </div>
  );
};
