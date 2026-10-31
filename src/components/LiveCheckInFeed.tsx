import React from 'react';
import { History, CheckCircle2, RotateCcw, Clock, ShieldCheck, UserCheck, AlertCircle, Share2, MessageCircle } from 'lucide-react';
import { Guest, CheckInLog, EventDetails } from '../types/invitation';

interface LiveCheckInFeedProps {
  event: EventDetails;
  guests: Guest[];
  onUpdateGuest: (updated: Guest) => void;
  onNavigateToScanner: () => void;
}

interface FlattenedLogItem {
  guest: Guest;
  log: CheckInLog;
}

export const LiveCheckInFeed: React.FC<LiveCheckInFeedProps> = ({
  event,
  guests,
  onUpdateGuest,
  onNavigateToScanner,
}) => {
  // Gather all logs across guests and sort newest first
  const allLogs: FlattenedLogItem[] = [];

  guests.forEach((g) => {
    g.checkInHistory.forEach((log) => {
      allLogs.push({ guest: g, log });
    });
  });

  // Sort by log id / timestamp reverse
  allLogs.sort((a, b) => b.log.id.localeCompare(a.log.id));

  // Undo specific check-in
  const handleUndoLog = (item: FlattenedLogItem) => {
    const { guest, log } = item;
    if (
      window.confirm(
        `هل تريد التراجع عن تسجيل دخول (${log.enteredCount}) شخص لـ "${guest.name}" المسجل في ${log.timestamp}؟`
      )
    ) {
      const newEntered = Math.max(0, guest.enteredSeats - log.enteredCount);
      const updatedLogs = guest.checkInHistory.filter((l) => l.id !== log.id);

      const updatedGuest: Guest = {
        ...guest,
        enteredSeats: newEntered,
        status: newEntered === 0 ? 'not_arrived' : 'partially_arrived',
        checkInHistory: updatedLogs,
      };

      onUpdateGuest(updatedGuest);
    }
  };

  const totalLogsCount = allLogs.length;
  const totalEnteredCount = allLogs.reduce((sum, item) => sum + item.log.enteredCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              سجل عمليات الدخول المباشر عند البوابة
            </h1>
            <p className="text-xs text-stone-500">
              توثيق لحظي لكل عملية مسح باركود مع الوقت وعدد الأشخاص الذين دخلوا
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold">
            إجمالي العمليات: <span className="font-mono text-amber-600 font-bold">{totalLogsCount}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            إجمالي الأشخاص: <span className="font-mono font-bold">{totalEnteredCount}</span>
          </div>
          <button
            onClick={onNavigateToScanner}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            الذهاب لشاشة الحارس
          </button>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden p-6">
        {allLogs.length > 0 ? (
          <div className="space-y-3">
            {allLogs.map((item) => (
              <div
                key={item.log.id}
                className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.log.isRejectedAttempt
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {item.log.isRejectedAttempt ? <AlertCircle className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {item.guest.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                        #{item.guest.code}
                      </span>
                      {item.log.isRejectedAttempt && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                          محاولة تجاوز تم صدها
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 flex flex-wrap items-center gap-2">
                      {item.log.isRejectedAttempt ? (
                        <span className="text-rose-600 font-bold">
                          تم رفض وحظر الدخول لعدم كفاية المقاعد
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          تم السماح بدخول {item.log.enteredCount} شخص {item.log.adultsEntered !== undefined && `(${item.log.adultsEntered} كبار + ${item.log.childrenEntered} أطفال)`}
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        المتبقي بالدعوة: {item.log.remainingAfter}
                      </span>
                      {item.log.guardNotes && (
                        <>
                          <span>·</span>
                          <span className="italic text-stone-600 dark:text-stone-300">
                            ملاحظة: {item.log.guardNotes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-stone-200/60 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{item.log.timestamp}</span>
                  </div>

                  {!item.log.isRejectedAttempt && (
                    <button
                      onClick={() => handleUndoLog(item)}
                      title="تراجع عن تسجيل الدخول هذا"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تراجع</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">
              لا توجد عمليات دخول مسجلة حتى الآن
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              عندما يقوم الحارس بمسح بطاقة أي ضيف وتأكيد الدخول، ستظهر جميع العمليات هنا موثقة بالوقت الدقيق مع إمكانية التراجع.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
