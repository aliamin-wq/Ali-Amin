import React from 'react';
import { Smartphone, X, QrCode, Users, CheckCircle2, AlertTriangle, XCircle, Calendar, Clock, MapPin, Share2 } from 'lucide-react';
import { Guest, EventDetails, isGuestUnlimited } from '../types/invitation';

interface GuestMobilePreviewModalProps {
  guest: Guest;
  event: EventDetails;
  qrDataUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSimulateScan: () => void;
}

export const GuestMobilePreviewModal: React.FC<GuestMobilePreviewModalProps> = ({
  guest,
  event,
  qrDataUrl,
  isOpen,
  onClose,
  onSimulateScan,
}) => {
  if (!isOpen) return null;

  const isUnlimited = isGuestUnlimited(guest);
  const remaining = Math.max(0, guest.maxSeats - guest.enteredSeats);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-sm my-auto">
        {/* Close Button Top Floating */}
        <button
          onClick={onClose}
          className="absolute -top-12 left-0 text-white hover:text-stone-300 flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full"
        >
          <X className="w-4 h-4" />
          <span>إغلاق المعاينة</span>
        </button>

        {/* Mobile Phone Mockup Frame */}
        <div className="w-full bg-stone-900 rounded-[42px] p-3 shadow-2xl border-4 border-stone-800 text-stone-100 ring-1 ring-white/10">
          {/* Phone Speaker & Dynamic Island */}
          <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 mr-2" />
          </div>

          {/* Phone Screen Container */}
          <div className="bg-[#0b291e] rounded-[32px] overflow-hidden border border-amber-600/30 text-amber-50 p-4 max-h-[82vh] overflow-y-auto">
            {/* Top Brand bar */}
            <div className="text-center pb-3 border-b border-amber-500/20">
              <span className="text-[10px] text-amber-300/80 font-medium tracking-wide">
                بطاقة الدخول الرقمية الذكية
              </span>
              <h2 className="text-base font-black font-serif text-amber-200 mt-0.5">
                {event.title}
              </h2>
            </div>

            {/* Guest Name & Allowed Headcount Badge */}
            <div className="my-3 text-center bg-black/25 p-3 rounded-2xl border border-amber-500/30">
              <span className="text-[10px] text-amber-300 block mb-0.5">
                مرحباً بكم يا كريم الحضور:
              </span>
              <div className="text-base font-black text-white">
                {guest.name}
              </div>

              {/* Headcount Capacity */}
              <div className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-md ${
                isUnlimited 
                  ? 'bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 text-stone-950 border border-amber-100 ring-2 ring-amber-400/30'
                  : 'bg-amber-500 text-stone-950'
              }`}>
                <Users className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                <span>
                  {isUnlimited 
                    ? '👑 أهل الحفل والكرامة (سعة مفتوحة بدون تقييد)' 
                    : `دعوة مخصصة لـ (${guest.maxSeats}) أشخاص`}
                </span>
              </div>

              {/* Status */}
              <div className="mt-2 text-[10px] flex items-center justify-center gap-1 font-semibold">
                {isUnlimited ? (
                  <span className="text-amber-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-300" />
                    دعوة شرفية مفتوحة — دخول حر لجميع الأقارب (دخل {guest.enteredSeats})
                  </span>
                ) : remaining === 0 ? (
                  <span className="text-rose-300 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    تم الدخول مسبقاً (0 مقاعد متبقية)
                  </span>
                ) : guest.enteredSeats > 0 ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    دخل ({guest.enteredSeats}) ومتبقي ({remaining}) أشخاص
                  </span>
                ) : (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    صالحة بالكامل (متبقي {remaining} مقاعد)
                  </span>
                )}
              </div>
            </div>

            {/* BIG QR CODE TICKET */}
            <div className="bg-white rounded-2xl p-4 text-stone-950 text-center shadow-lg my-3 border border-stone-200">
              <div className="text-[11px] font-bold text-stone-600 mb-1">
                وجّه هذا الرمز للحارس عند البوابة
              </div>

              {qrDataUrl && (
                <div className="flex justify-center my-1">
                  <img
                    src={qrDataUrl}
                    alt="Guest QR"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>
              )}

              {/* 4 Digit PIN backup */}
              <div className="inline-block mt-1 px-3 py-1 rounded-lg bg-stone-100 text-[11px] border border-stone-300">
                <span>رمز الدخول السريع: </span>
                <span className="font-mono font-black text-sm text-amber-700 tracking-wider">
                  #{guest.code}
                </span>
              </div>
            </div>

            {/* Event Info Strip */}
            <div className="space-y-1.5 text-[11px] bg-black/25 p-3 rounded-2xl border border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{event.dateGregorian}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{event.timeString}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{event.venueName}</span>
              </div>
            </div>

            {/* Simulated Action: Present to Guard */}
            <button
              onClick={() => {
                onClose();
                onSimulateScan();
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>محاكاة: تقديم هذه البطاقة للحارس لفحصها الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
