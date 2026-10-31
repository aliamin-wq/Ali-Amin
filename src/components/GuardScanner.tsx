import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  CameraOff, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Users, 
  ArrowRight, 
  Clock, 
  RefreshCw,
  QrCode,
  Sparkles,
  ChevronLeft,
  KeyRound,
  User,
  Baby,
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Guest, 
  CheckInLog, 
  EventDetails, 
  isGuestUnlimited,
  getGuestAdultsRemaining,
  getGuestChildrenRemaining,
  getGuestTotalRemaining
} from '../types/invitation';
import { soundFx } from '../utils/audio';
import { buildCheckInWhatsAppUrl } from '../utils/whatsapp';
import { FullStatisticsView } from './FullStatisticsView';
import jsQR from 'jsqr';

interface GuardScannerProps {
  event: EventDetails;
  guests: Guest[];
  onUpdateGuest: (updated: Guest) => void;
  onNavigateToCard: (guestId: string) => void;
}

export const GuardScanner: React.FC<GuardScannerProps> = ({
  event,
  guests,
  onUpdateGuest,
  onNavigateToCard,
}) => {
  const [showFullStats, setShowFullStats] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [arrivingAdults, setArrivingAdults] = useState<number>(1);
  const [arrivingChildren, setArrivingChildren] = useState<number>(0);
  const [guardNote, setGuardNote] = useState<string>('');
  const [lastActionMessage, setLastActionMessage] = useState<{ text: string; type: 'success' | 'danger' | 'warning' } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  // Sync selectedGuest with updated state
  useEffect(() => {
    if (selectedGuest) {
      const fresh = guests.find((g) => g.id === selectedGuest.id);
      if (fresh) setSelectedGuest(fresh);
    }
  }, [guests, selectedGuest]);

  // Handle locating a guest by Token, ID, 4-digit code, or Name
  const handleInspectGuest = useCallback((guest: Guest) => {
    setSelectedGuest(guest);
    const isUnlimited = isGuestUnlimited(guest);
    const remAdults = getGuestAdultsRemaining(guest);
    const remChildren = getGuestChildrenRemaining(guest);
    const totalRemaining = isUnlimited ? 9999 : remAdults + remChildren;

    // Default arriving adults & children
    if (isUnlimited) {
      setArrivingAdults(2);
      setArrivingChildren(1);
    } else {
      setArrivingAdults(remAdults > 0 ? 1 : 0);
      setArrivingChildren(0);
    }

    setGuardNote('');
    setLastActionMessage(null);

    // Audio cue based on immediate status
    if (!isUnlimited && totalRemaining === 0) {
      soundFx.playReject();
    } else {
      soundFx.playSuccess();
    }
  }, []);

  // Process raw text detected by QR or manual input
  const processRawScanData = useCallback((scannedText: string) => {
    const clean = scannedText.trim();
    if (!clean) return;

    // Try finding by Token or direct URL
    let found = guests.find(
      (g) =>
        clean === g.invitationUrlToken ||
        clean.includes(g.invitationUrlToken) ||
        clean === g.id ||
        clean === g.code
    );

    // If not found directly, try matching 4 digits
    if (!found) {
      found = guests.find((g) => g.code === clean || g.name.toLowerCase().includes(clean.toLowerCase()));
    }

    if (found) {
      handleInspectGuest(found);
    } else {
      soundFx.playReject();
      setLastActionMessage({
        text: `رمز غير مسجل في قائمة الضيوف: "${clean}"`,
        type: 'danger',
      });
    }
  }, [guests, handleInspectGuest]);

  // Video scanning loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        processRawScanData(code.data);
        // Pause camera briefly after scan
        stopCamera();
        return;
      }
    }

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  }, [processRawScanData]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setIsCameraActive(true);
          scanLoopRef.current = requestAnimationFrame(scanFrame);
        }
      } else {
        setCameraError('الكاميرا غير مدعومة في هذا المتصفح');
      }
    } catch (err) {
      console.error(err);
      setCameraError('تعذر فتح الكاميرا (يرجى التحقق من أذونات الكاميرا أو استخدام كود الدعوة)');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      processRawScanData(searchQuery);
    }
  };

  // Remaining seats calculation
  const isUnlimited = isGuestUnlimited(selectedGuest);
  const remAdults = selectedGuest ? getGuestAdultsRemaining(selectedGuest) : 0;
  const remChildren = selectedGuest ? getGuestChildrenRemaining(selectedGuest) : 0;
  const remainingSeats = isUnlimited ? 9999 : remAdults + remChildren;
  const arrivingCount = arrivingAdults + arrivingChildren;

  const isAdultsExceeding = !isUnlimited && arrivingAdults > remAdults;
  const isChildrenExceeding = !isUnlimited && arrivingChildren > remChildren;
  const isExceeding = !isUnlimited && (isAdultsExceeding || isChildrenExceeding || arrivingCount > remainingSeats);
  const isFullyExhausted = !isUnlimited && remainingSeats === 0;

  // Confirm Entrance
  const handleConfirmAdmission = () => {
    if (!selectedGuest) return;

    if (isExceeding) {
      soundFx.playReject();
      setLastActionMessage({
        text: `⛔ مرفوض! لا يمكن إدخال (${arrivingAdults} بالغين و ${arrivingChildren} أطفال) لأن المتبقي المسموح به هو (${remAdults} بالغين و ${remChildren} أطفال فقط)!`,
        type: 'danger',
      });
      return;
    }

    if (arrivingCount <= 0) {
      setLastActionMessage({
        text: 'يرجى تحديد شخص واحد على الأقل للدخول (بالغين أو أطفال)',
        type: 'warning',
      });
      return;
    }

    const newAdultsEntered = (selectedGuest.adultsEntered ?? 0) + arrivingAdults;
    const newChildrenEntered = (selectedGuest.childrenEntered ?? 0) + arrivingChildren;
    const newEntered = newAdultsEntered + newChildrenEntered;
    const newRemaining = isUnlimited ? 9999 : Math.max(0, selectedGuest.maxSeats - newEntered);
    const nowTime = new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());

    const newLog: CheckInLog = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      enteredCount: arrivingCount,
      adultsEntered: arrivingAdults,
      childrenEntered: arrivingChildren,
      totalAllowed: isUnlimited ? 9999 : selectedGuest.maxSeats,
      remainingAfter: newRemaining,
      guardNotes: guardNote.trim() || undefined,
    };

    const updatedGuest: Guest = {
      ...selectedGuest,
      enteredSeats: newEntered,
      adultsEntered: newAdultsEntered,
      childrenEntered: newChildrenEntered,
      status: !isUnlimited && newRemaining === 0 ? 'fully_arrived' : 'partially_arrived',
      checkInHistory: [newLog, ...selectedGuest.checkInHistory],
    };

    onUpdateGuest(updatedGuest);
    soundFx.playSuccess();

    if (selectedGuest.category === 'vip' || isUnlimited) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    setLastActionMessage({
      text: isUnlimited
        ? `أهلاً بأهل الحفل! تم تأكيد دخول (${arrivingCount}) [${arrivingAdults} بالغين + ${arrivingChildren} أطفال] بنجاح (سعة مفتوحة).`
        : `تم السماح بالدخول بنجاح! دخل الآن (${arrivingCount}) [${arrivingAdults} بالغين + ${arrivingChildren} أطفال]. المتبقي للدعوة: (${newRemaining}) مقاعد.`,
      type: 'success',
    });
  };

  // Record Blocked Violation
  const handleRecordRejectedAttempt = () => {
    if (!selectedGuest) return;
    soundFx.playReject();
    const nowTime = new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());

    const rejLog: CheckInLog = {
      id: `rej-${Date.now()}`,
      timestamp: nowTime,
      enteredCount: 0,
      adultsEntered: 0,
      childrenEntered: 0,
      totalAllowed: selectedGuest.maxSeats,
      remainingAfter: remainingSeats,
      guardNotes: `محاولة تجاوز مرفوضة: طلب إدخال (${arrivingAdults} بالغين و ${arrivingChildren} أطفال) والمتاح (${remAdults} بالغين و ${remChildren} أطفال)`,
      isRejectedAttempt: true,
    };

    const updatedGuest: Guest = {
      ...selectedGuest,
      rejectedAttempts: (selectedGuest.rejectedAttempts ?? 0) + 1,
      checkInHistory: [rejLog, ...selectedGuest.checkInHistory],
    };

    onUpdateGuest(updatedGuest);

    setLastActionMessage({
      text: `⛔ تم حظر الدخول وتسجيل محاولة التجاوز رسمياً في السجل الرقابي للحفل!`,
      type: 'danger',
    });
  };

  // Quick reset / clear current inspect
  const handleClear = () => {
    setSelectedGuest(null);
    setSearchQuery('');
    setLastActionMessage(null);
  };

  // Filtered search suggestions if typing
  const searchResults = searchQuery.trim().length >= 2
    ? guests.filter(
        (g) =>
          g.name.includes(searchQuery.trim()) ||
          g.code.includes(searchQuery.trim()) ||
          g.id.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  if (showFullStats) {
    return (
      <FullStatisticsView
        guests={guests}
        event={event}
        onBackToScanner={() => setShowFullStats(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Guard Mode Header */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  شاشة الحارس ومسؤول البوابة
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                  نظام التدقيق الفوري
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                فحص رمز الباركود أو الـ QR لمنع التجاوز والتأكد من عدد المدعوين المسموح به
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setShowFullStats(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائية الكاملة للحضور والمتبقي</span>
            </button>

            {isCameraActive ? (
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm"
              >
                <CameraOff className="w-4 h-4" />
                <span>إيقاف الكاميرا</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>تشغيل كاميرا الماسح</span>
              </button>
            )}
          </div>
        </div>

        {/* Camera Viewport Modal / Container */}
        {isCameraActive && (
          <div className="mt-5 relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500/40 shadow-inner max-w-md mx-auto aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle / Scanner overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="relative w-64 h-64 border-2 border-white/60 rounded-3xl overflow-hidden shadow-2xl backdrop-contrast-125">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scanner-line shadow-[0_0_15px_#f59e0b]" />
                {/* Corner reticle decorations */}
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
              </div>
              <p className="text-xs text-white/90 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full mt-4 font-medium">
                وجّه الكاميرا نحو باركود أو كود QR الدعوة
              </p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Manual Search & Fast Test Scenarios Strip */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Search by Name / 4-Digit Code */}
          <div className="lg:col-span-7">
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-2">
              البحث برمز الدعوة (4 أرقام) أو اسم المدعو
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="أدخل الرمز مثلاً: 7412 أو اسم المدعو..."
                className="w-full h-12 pr-11 pl-24 text-sm bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-stone-900 dark:text-stone-100"
              />
              <Search className="w-5 h-5 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute left-2 top-2 h-8 px-4 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                فحص
              </button>
            </form>

            {/* Instant suggestions if typing */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden bg-white dark:bg-stone-800 shadow-md">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleInspectGuest(item);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-right hover:bg-stone-50 dark:hover:bg-stone-700/50 border-b border-stone-100 dark:border-stone-700/50 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-stone-500">
                        كود: <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{item.code}</span> · مسموح: {item.maxSeats} مقاعد
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.enteredSeats === 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.enteredSeats < item.maxSeats
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.enteredSeats === 0 ? 'جديدة' : `دخل ${item.enteredSeats}/${item.maxSeats}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 1-Click Fast Demonstration Scenarios */}
          <div className="lg:col-span-5 bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-700 dark:text-stone-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>أزرار تجربة سريعة للحارس (محاكاة فورية):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const g = guests.find((item) => item.code === '7412') || guests[0];
                  if (g) handleInspectGuest(g);
                }}
                className="p-2 text-right rounded-lg bg-white dark:bg-stone-800 border border-emerald-200 hover:border-emerald-400 text-xs transition-all shadow-xs group"
              >
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>بطاقة جديدة</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] text-stone-500 truncate mt-0.5">
                  مسموح (4) - لم يدخل أحد
                </div>
              </button>

              <button
                onClick={() => {
                  const g = guests.find((item) => item.code === '3890') || guests[1];
                  if (g) handleInspectGuest(g);
                }}
                className="p-2 text-right rounded-lg bg-white dark:bg-stone-800 border border-amber-200 hover:border-amber-400 text-xs transition-all shadow-xs group"
              >
                <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>دخول جزئي</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="text-[11px] text-stone-500 truncate mt-0.5">
                  دخل (1) - متبقي (1)
                </div>
              </button>

              <button
                onClick={() => {
                  const g = guests.find((item) => item.code === '5261') || guests[2];
                  if (g) handleInspectGuest(g);
                }}
                className="p-2 text-right rounded-lg bg-white dark:bg-stone-800 border border-rose-200 hover:border-rose-400 text-xs transition-all shadow-xs group"
              >
                <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                  <span>مرفوضة / مكتملة</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <div className="text-[11px] text-stone-500 truncate mt-0.5">
                  مستنفدة (0 متبقي)
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LAST ACTION ALERT BANNER */}
      {lastActionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm transition-all ${
            lastActionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100'
              : lastActionMessage.type === 'danger'
              ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100 animate-pulse'
              : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100'
          }`}
        >
          {lastActionMessage.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
          {lastActionMessage.type === 'danger' && <XCircle className="w-6 h-6 text-rose-600 shrink-0" />}
          {lastActionMessage.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
          <div className="flex-1 font-semibold text-sm leading-relaxed">
            {lastActionMessage.text}
          </div>
          <button
            onClick={() => setLastActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            إغلاق
          </button>
        </div>
      )}


      {/* MAIN GATE DECISION CARD (Active Guest Inspection) */}
      {selectedGuest ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden transition-all">
          {/* Status Header Banner */}
          <div
            className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white ${
              isUnlimited
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600'
                : isFullyExhausted
                ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-red-800'
                : selectedGuest.enteredSeats > 0
                ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800'
                : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isUnlimited ? (
                <Sparkles className="w-8 h-8 text-white drop-shadow-md shrink-0" />
              ) : isFullyExhausted ? (
                <XCircle className="w-8 h-8 text-white drop-shadow-md shrink-0" />
              ) : selectedGuest.enteredSeats > 0 ? (
                <AlertTriangle className="w-8 h-8 text-white drop-shadow-md shrink-0" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md shrink-0" />
              )}
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
                  نتيجة فحص البوابة
                </div>
                <div className="text-xl font-bold">
                  {isUnlimited
                    ? '👑 أهل الحفل (عائلة العريس / العروس) - دخول وسعة مفتوحة بالكامل'
                    : isFullyExhausted
                    ? '⛔ تم استنفاد المقاعد بالكامل (مرفوض)'
                    : selectedGuest.enteredSeats > 0
                    ? `⚠️ بطاقة مستخدمة جزئياً (متبقي ${remainingSeats} فقط)`
                    : '✅ دعوة صالحة وجاهزة للدخول'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToCard(selectedGuest.id)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>معاينة كرت المدعو</span>
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-black/30 hover:bg-black/40 rounded-lg text-xs font-medium backdrop-blur-xs transition-colors"
              >
                إغلاق الفحص
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Guest Identity Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                    رمز: {selectedGuest.code}
                  </span>
                  <span className="text-xs text-stone-500">
                    رقم التسجيل: {selectedGuest.id}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  {selectedGuest.name}
                </h2>
                {selectedGuest.notes && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-3 py-1 rounded-lg inline-block">
                    ملاحظة: {selectedGuest.notes}
                  </p>
                )}
              </div>

              {/* Category & Phone */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="px-3 py-1.5 rounded-xl font-bold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  {selectedGuest.category === 'vip' && '👑 كبار الشخصيات (VIP)'}
                  {selectedGuest.category === 'family_groom' && '💍 عائلة العريس'}
                  {selectedGuest.category === 'family_bride' && '💐 عائلة العروس'}
                  {selectedGuest.category === 'friends' && '🤝 الأصدقاء'}
                  {selectedGuest.category === 'general' && '⭐ عام'}
                </div>
                {selectedGuest.phone && (
                  <div className="text-stone-500 font-mono" dir="ltr">
                    {selectedGuest.phone}
                  </div>
                )}
              </div>
            </div>

            {/* SEAT BREAKDOWN CARDS (Core Math: Adults & Children) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Allowed */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 text-center">
                <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">
                  إجمالي السعة المسموحة بالبطاقة
                </span>
                <div className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                  {isUnlimited ? 'مفتوح ∞' : selectedGuest.maxSeats}
                </div>
                <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mt-1">
                  {isUnlimited
                    ? '👑 أهل الحفل - سعة مفتوحة'
                    : `👨 ${selectedGuest.adultsAllowed ?? selectedGuest.maxSeats} بالغين • 🧒 ${selectedGuest.childrenAllowed ?? 0} أطفال`}
                </span>
              </div>

              {/* Already Inside */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-center">
                <span className="text-xs text-amber-800 dark:text-amber-300 block mb-1">
                  الذين دخلوا مسبقاً
                </span>
                <div className="text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  {selectedGuest.enteredSeats}
                </div>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block mt-1">
                  {selectedGuest.enteredSeats === 0
                    ? 'لم يدخل أحد بعد'
                    : `👨 ${selectedGuest.adultsEntered ?? 0} بالغين • 🧒 ${selectedGuest.childrenEntered ?? 0} أطفال`}
                </span>
              </div>

              {/* Remaining Allowed */}
              <div
                className={`p-4 rounded-2xl border text-center transition-all ${
                  isUnlimited
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : remainingSeats === 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                }`}
              >
                <span
                  className={`text-xs block mb-1 font-semibold ${
                    isUnlimited
                      ? 'text-amber-800 dark:text-amber-200'
                      : remainingSeats === 0
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  المتبقي المسموح به للدخول الآن
                </span>
                <div
                  className={`text-3xl font-black font-mono ${
                    isUnlimited
                      ? 'text-amber-600 dark:text-amber-400'
                      : remainingSeats === 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isUnlimited ? 'مفتوح ∞' : remainingSeats}
                </div>
                <span className="text-[11px] font-semibold block mt-1">
                  {isUnlimited ? (
                    <span className="text-amber-700 dark:text-amber-300">مسموح دائماً</span>
                  ) : remainingSeats === 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">0 مقاعد (مكتمل بالكامل)</span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      👨 {remAdults} بالغين • 🧒 {remChildren} أطفال
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* ADMISSION CONTROLLER: Adults & Children Separate Inputs */}
            {!isFullyExhausted ? (
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      تحديد عدد الأشخاص الواقفين للدخول الآن:
                    </h3>
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                    المتاح حالياً بالبطاقة: {isUnlimited ? 'مفتوح ∞' : <b className="font-mono text-stone-900 dark:text-white">{remAdults} بالغين و {remChildren} أطفال</b>}
                  </div>
                </div>

                {/* DUAL COUNTERS: 1) ADULTS & 2) CHILDREN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Adults Counter */}
                  <div className={`p-4 rounded-xl border bg-white dark:bg-stone-800 transition-all ${
                    isAdultsExceeding
                      ? 'border-rose-400 ring-2 ring-rose-300 dark:ring-rose-900'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800 dark:text-stone-200">
                        <User className="w-4 h-4 text-amber-600" />
                        <span>فئة البالغين (الكبار)</span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        متبقي مسموح: <b className="font-mono text-stone-800 dark:text-stone-200">{isUnlimited ? '∞' : remAdults}</b>
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setArrivingAdults((prev) => Math.max(0, prev - 1))}
                        className="w-11 h-11 flex items-center justify-center text-xl font-bold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={arrivingAdults}
                        onChange={(e) => setArrivingAdults(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 h-11 text-center text-2xl font-black font-mono bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setArrivingAdults((prev) => prev + 1)}
                        className="w-11 h-11 flex items-center justify-center text-xl font-bold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100"
                      >
                        +
                      </button>
                    </div>

                    {isAdultsExceeding && (
                      <div className="mt-2 text-center text-[10px] font-bold text-rose-600">
                        ⚠️ تجاوزت عدد البالغين المسموح ({remAdults} فقط)
                      </div>
                    )}
                  </div>

                  {/* 2. Children Counter */}
                  <div className={`p-4 rounded-xl border bg-white dark:bg-stone-800 transition-all ${
                    isChildrenExceeding
                      ? 'border-rose-400 ring-2 ring-rose-300 dark:ring-rose-900'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800 dark:text-stone-200">
                        <Baby className="w-4 h-4 text-teal-600" />
                        <span>فئة الأطفال</span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        متبقي مسموح: <b className="font-mono text-stone-800 dark:text-stone-200">{isUnlimited ? '∞' : remChildren}</b>
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setArrivingChildren((prev) => Math.max(0, prev - 1))}
                        className="w-11 h-11 flex items-center justify-center text-xl font-bold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={arrivingChildren}
                        onChange={(e) => setArrivingChildren(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 h-11 text-center text-2xl font-black font-mono bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setArrivingChildren((prev) => prev + 1)}
                        className="w-11 h-11 flex items-center justify-center text-xl font-bold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100"
                      >
                        +
                      </button>
                    </div>

                    {isChildrenExceeding && (
                      <div className="mt-2 text-center text-[10px] font-bold text-rose-600">
                        ⚠️ تجاوزت عدد الأطفال المسموح ({remChildren} فقط)
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Tally Line */}
                <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between text-xs">
                  <div className="font-bold text-stone-800 dark:text-stone-200">
                    مجموع الواقفين للدخول الآن: <span className="font-mono text-base text-amber-600 dark:text-amber-400 font-black">{arrivingCount}</span> شخص ({arrivingAdults} كبار + {arrivingChildren} أطفال)
                  </div>
                  <div className="flex items-center gap-2">
                    {!isUnlimited && remAdults > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setArrivingAdults(remAdults);
                          setArrivingChildren(remChildren);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 text-[11px] font-bold text-stone-700 dark:text-stone-200"
                      >
                        إدخال كل المتبقي ({remainingSeats})
                      </button>
                    )}
                  </div>
                </div>

                {/* REAL-TIME DANGER / REJECTION BANNER WHEN EXCEEDING */}
                {isExceeding && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-500 text-rose-950 dark:text-rose-100 space-y-2.5 animate-pulse shadow-md">
                    <div className="flex items-center gap-2 font-black text-sm text-rose-700 dark:text-rose-300">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>تنبيه للحارس: تم تجاوز العدد المسموح به! الدخول مرفوض ومحظور ❌</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-200">
                      طلب الدخول يتضمن <b>({arrivingAdults} بالغين و {arrivingChildren} أطفال = {arrivingCount} أشخاص)</b> بينما المتبقي الفعلي المسموح به في البطاقة هو <b>({remAdults} بالغين و {remChildren} أطفال = {remainingSeats} فقط)</b>. النظام يمنع تجاوز السعة قطعياً!
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setArrivingAdults(remAdults);
                          setArrivingChildren(remChildren);
                        }}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        ضبط الأعداد تلقائياً للحد المسموح به ({remAdults} كبار + {remChildren} أطفال)
                      </button>
                      <button
                        type="button"
                        onClick={handleRecordRejectedAttempt}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 rounded-lg text-xs font-bold border border-rose-300 transition-colors"
                      >
                        تسجيل محاولة التجاوز في السجل الرقابي 🛑
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Guard Note */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={guardNote}
                    onChange={(e) => setGuardNote(e.target.value)}
                    placeholder="ملاحظة الحارس (اختياري، مثلاً: دخل رب الأسرة ومعه طفل)..."
                    className="w-full text-xs p-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none text-stone-900 dark:text-stone-100"
                  />
                </div>

                {/* CONFIRM / SUBMIT ACTION */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    disabled={isExceeding || arrivingCount <= 0}
                    onClick={handleConfirmAdmission}
                    className={`flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isExceeding || arrivingCount <= 0
                        ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed shadow-none border border-stone-400/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20 active:scale-[0.99]'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {isExceeding
                        ? '⛔ مرفوض - تجاوز السعة المسموحة بالبطاقة'
                        : arrivingCount <= 0
                        ? 'حدد شخص واحد على الأقل للدخول'
                        : `تأكيد السماح بالدخول لـ (${arrivingCount}) [${arrivingAdults} بالغين + ${arrivingChildren} أطفال]`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-14 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-semibold transition-colors"
                  >
                    إلغاء / التالي
                  </button>
                </div>
              </div>
            ) : (
              /* If Fully Exhausted -> Red Notice & Block */
              <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-rose-800 dark:text-rose-200">
                  هذه الدعوة استنفدت جميع مقاعدها ({selectedGuest.maxSeats}) ولا يمكن دخول أي شخص إضافي!
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
                  إذا كان هناك ضيف مرافق جديد يحاول الدخول بهذه الدعوة، يجب إبلاغه بأن الحد الأقصى المسموح تم استخدامه بالكامل سابقاً.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleClear}
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl"
                  >
                    فحص بطاقة ضيف آخر
                  </button>
                </div>
              </div>
            )}

            {/* CHECK-IN HISTORY LOG FOR THIS GUEST */}
            {selectedGuest.checkInHistory.length > 0 && (
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>سجل مرات الدخول السابقة لهذه الدعوة:</span>
                </h4>
                <div className="space-y-2">
                  {selectedGuest.checkInHistory.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            دخول {log.enteredCount} شخص
                          </span>
                          {log.guardNotes && (
                            <span className="text-stone-500 mr-2">
                              ({log.guardNotes})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-stone-500">
                        <span>المتبقي بعدها: {log.remainingAfter}</span>
                        <span className="font-mono">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty / Waiting state */
        <div className="bg-stone-100/70 dark:bg-stone-900/40 rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-1">
            في انتظار مسح كرت أو إدخال رمز الدعوة
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-6">
            استخدم كاميرا الماسح لمسح كود الـ QR، أو أدخل رمز الدعوة اليدوي من 4 أرقام، أو اضغط على أحد أزرار التجربة السريعة أعلاه.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startCamera}
              className="px-5 py-2.5 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>فتح الكاميرا للمسح</span>
            </button>
            <button
              onClick={() => {
                const g = guests[0];
                if (g) handleInspectGuest(g);
              }}
              className="px-5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl"
            >
              تجربة فحص الضيف الأول
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
