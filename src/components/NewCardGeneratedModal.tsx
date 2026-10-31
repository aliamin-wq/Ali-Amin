import React, { useState, useEffect } from 'react';
import { QrCode, Check, Copy, Share2, Printer, Users, Sparkles, X, ArrowRight } from 'lucide-react';
import { Guest, EventDetails, isGuestUnlimited } from '../types/invitation';
import { generateQrCodeDataUrl, generateBarcodePattern } from '../utils/qr';

interface NewCardGeneratedModalProps {
  guest: Guest | null;
  event: EventDetails;
  isOpen: boolean;
  onClose: () => void;
  onViewFullCard: (guestId: string) => void;
  onAddNewAnother: () => void;
}

export const NewCardGeneratedModal: React.FC<NewCardGeneratedModalProps> = ({
  guest,
  event,
  isOpen,
  onClose,
  onViewFullCard,
  onAddNewAnother,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!guest) return;
    let isMounted = true;
    const generate = async () => {
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
      const fullUrl = `${baseUrl}?ticket=${guest.invitationUrlToken}`;
      const url = await generateQrCodeDataUrl(fullUrl, {
        width: 300,
        darkColor: '#0f172a',
        lightColor: '#ffffff',
      });
      if (isMounted) setQrUrl(url);
    };
    generate();
    return () => {
      isMounted = false;
    };
  }, [guest]);

  if (!isOpen || !guest) return null;

  const isUnlimited = isGuestUnlimited(guest);
  const barcodePattern = generateBarcodePattern(guest.code + guest.id);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}?ticket=${guest.invitationUrlToken}`;
    navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}?ticket=${guest.invitationUrlToken}`;
    const seatsText = isUnlimited ? 'سعة ودخول مفتوح (أهل الحفل)' : `(${guest.maxSeats}) أشخاص`;
    const message = `السلام عليكم ورحمة الله وبركاته،\n` +
      `الأخ الكريم: *${guest.name}*\n\n` +
      `يسرنا دعوتكم لحضور *${event.title}* (${event.hostName})\n` +
      `📅 *التاريخ:* ${event.dateGregorian}\n` +
      `⏰ *الوقت:* ${event.timeString}\n` +
      `📍 *المكان:* ${event.venueName}\n\n` +
      `🎫 *بيانات بطاقة الدخول:*\n` +
      `• السعة المخصصة: *${seatsText}*\n` +
      `• رمز الدخول السريع: *#${guest.code}*\n` +
      `• رابط كرت الدعوة ورمز الـ QR المباشر:\n${fullUrl}\n\n` +
      `أهلاً وسهلاً بكم في أفراحنا.`;

    const cleanPhone = guest.phone?.replace(/[^0-9]/g, '') || '';
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
            تم إنشاء كرت الدعوة والباركود بنجاح!
          </h3>
          <p className="text-xs text-stone-500">
            أصبح بإمكانك مشاركة الرمز مع المدعو فوراً أو طباعته
          </p>
        </div>

        {/* Guest Summary Card */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-center">
          <span className="text-[11px] text-stone-400 block mb-0.5">اسم المدعو:</span>
          <div className="text-lg font-black text-stone-900 dark:text-white">
            {guest.name}
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-stone-950 font-black text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>
              {isUnlimited ? '👑 أهل الحفل - سعة مفتوحة وغير مقيدة بأرقام' : `مخصص لـ (${guest.maxSeats}) مقاعد [${guest.adultsAllowed ?? guest.maxSeats} بالغين • ${guest.childrenAllowed ?? 0} أطفال]`}
            </span>
          </div>
        </div>

        {/* The Generated QR & Barcode Container */}
        <div className="p-4 rounded-2xl bg-white text-stone-900 border-2 border-stone-200 text-center shadow-inner space-y-3">
          <div className="text-[11px] font-bold text-stone-600">
            رمز الـ QR المباشر للبطاقة (جاهز للمسح عند البوابة)
          </div>

          <div className="flex justify-center">
            {qrUrl ? (
              <div className="p-2 bg-white rounded-xl border border-stone-300 shadow-xs inline-block">
                <img
                  src={qrUrl}
                  alt="Generated QR"
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-44 h-44 bg-stone-100 rounded-xl flex items-center justify-center text-xs text-stone-400">
                جارٍ تجهيز الرمز...
              </div>
            )}
          </div>

          {/* 4-digit code */}
          <div className="inline-block px-3 py-1 rounded-lg bg-stone-100 border border-stone-300 text-xs">
            <span className="text-stone-600">كود الدخول السريع: </span>
            <span className="font-mono font-black text-amber-700 tracking-wider">
              #{guest.code}
            </span>
          </div>

          {/* Barcode Graphic */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex justify-center items-end h-8 gap-[2px] px-4 max-w-xs mx-auto">
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

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleWhatsAppShare}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>إرسال كرت الدعوة والرمز عبر واتساب فوراً</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="h-10 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-stone-200 dark:border-stone-700"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{isCopied ? 'تم نسخ الرابط' : 'نسخ الرابط'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onViewFullCard(guest.id);
              }}
              className="h-10 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>معاينة الكرت الفاخر</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onAddNewAnother();
            }}
            className="w-full py-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 text-xs font-medium transition-colors"
          >
            + إضافة مدعو جديد آخر
          </button>
        </div>
      </div>
    </div>
  );
};
