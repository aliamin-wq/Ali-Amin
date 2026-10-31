import React, { useState } from 'react';
import { 
  BarChart3, Users, UserCheck, Clock, ShieldAlert, Sparkles, 
  ArrowUpDown, Search, Filter, Baby, User, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, Printer
} from 'lucide-react';
import { Guest, EventDetails, isGuestUnlimited, getGuestAdultsRemaining, getGuestChildrenRemaining, getGuestTotalRemaining } from '../types/invitation';


interface FullStatisticsViewProps {
  guests: Guest[];
  event: EventDetails;
  onBackToScanner?: () => void;
}

export const FullStatisticsView: React.FC<FullStatisticsViewProps> = ({
  guests,
  event,
  onBackToScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculations
  const standardGuests = guests.filter((g) => !isGuestUnlimited(g));
  const familyGuests = guests.filter((g) => isGuestUnlimited(g));

  // Allowed Breakdown
  const totalAdultsAllowed = standardGuests.reduce((sum, g) => sum + (g.adultsAllowed ?? g.maxSeats), 0);
  const totalChildrenAllowed = standardGuests.reduce((sum, g) => sum + (g.childrenAllowed ?? 0), 0);
  const totalStandardAllocated = totalAdultsAllowed + totalChildrenAllowed;

  // Entered Breakdown
  const totalAdultsEntered = guests.reduce((sum, g) => sum + (g.adultsEntered ?? 0), 0);
  const totalChildrenEntered = guests.reduce((sum, g) => sum + (g.childrenEntered ?? 0), 0);
  const totalEntered = totalAdultsEntered + totalChildrenEntered;

  // Remaining Breakdown
  const standardAdultsEntered = standardGuests.reduce((sum, g) => sum + (g.adultsEntered ?? 0), 0);
  const standardChildrenEntered = standardGuests.reduce((sum, g) => sum + (g.childrenEntered ?? 0), 0);
  const remainingAdults = Math.max(0, totalAdultsAllowed - standardAdultsEntered);
  const remainingChildren = Math.max(0, totalChildrenAllowed - standardChildrenEntered);
  const totalRemaining = remainingAdults + remainingChildren;

  // Family Open Capacity Entered
  const familyEntered = familyGuests.reduce((sum, g) => sum + (g.enteredSeats ?? 0), 0);
  const familyAdultsEntered = familyGuests.reduce((sum, g) => sum + (g.adultsEntered ?? 0), 0);
  const familyChildrenEntered = familyGuests.reduce((sum, g) => sum + (g.childrenEntered ?? 0), 0);

  // Rejected Over-Capacity Attempts
  const totalRejectedAttempts = guests.reduce((sum, g) => sum + (g.rejectedAttempts ?? 0), 0);

  // Percentage
  const attendanceRate = totalStandardAllocated > 0
    ? Math.min(100, Math.round((standardGuests.reduce((s, g) => s + g.enteredSeats, 0) / totalStandardAllocated) * 100))
    : 0;

  // Filtered List
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.code.includes(searchTerm) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unlimited' && isGuestUnlimited(g)) ||
      (statusFilter === 'not_arrived' && g.status === 'not_arrived') ||
      (statusFilter === 'partially_arrived' && g.status === 'partially_arrived') ||
      (statusFilter === 'fully_arrived' && g.status === 'fully_arrived');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-stone-900 dark:text-stone-100">
                  لوحة الإحصائيات الكاملة للحضور والمتبقي
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold">
                  تحديث مباشر لحظي
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                توزيع تفصيلي للبالغين والأطفال، والمتبقين، ومحاولات التجاوز الممنوعة
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {onBackToScanner && (
              <button
                onClick={onBackToScanner}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لشاشة الماسح</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة تقرير الإحصائية</span>
            </button>
          </div>
        </div>

        {/* Attendance Rate Visual Progress Bar */}
        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-stone-700 dark:text-stone-300">
              نسبة اكتمال حضور المقاعد المحددة:
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
              {attendanceRate}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6 Grid Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Entered */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-emerald-500/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
              إجمالي الذين دخلوا
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {totalEntered}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-[10px] space-y-0.5 text-stone-600 dark:text-stone-300 font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><User className="w-3 h-3 text-emerald-600" /> بالغين:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{totalAdultsEntered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Baby className="w-3 h-3 text-teal-600" /> أطفال:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{totalChildrenEntered}</span>
            </div>
          </div>
        </div>

        {/* 2. Total Remaining */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-amber-500/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
              المتبقين لم يدخلوا
            </span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {totalRemaining}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-[10px] space-y-0.5 text-stone-600 dark:text-stone-300 font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><User className="w-3 h-3 text-amber-600" /> باقي بالغين:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{remainingAdults}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Baby className="w-3 h-3 text-amber-500" /> باقي أطفال:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{remainingChildren}</span>
            </div>
          </div>
        </div>

        {/* 3. Total Standard Seats Capacity */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-stone-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
              إجمالي السعة المقيدة
            </span>
            <Users className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2 font-mono">
            {totalStandardAllocated}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-[10px] space-y-0.5 text-stone-600 dark:text-stone-300 font-medium">
            <div className="flex items-center justify-between">
              <span>مخصص بالغين:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{totalAdultsAllowed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>مخصص أطفال:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{totalChildrenAllowed}</span>
            </div>
          </div>
        </div>

        {/* 4. Family Open Budget Entered */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:bg-stone-900 rounded-2xl p-4 border border-amber-400/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              أهل الحفل (مفتوح)
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2 font-mono">
            {familyEntered} <span className="text-xs font-normal">شخص</span>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-stone-800 text-[10px] space-y-0.5 text-amber-800 dark:text-amber-200 font-medium">
            <div className="flex items-center justify-between">
              <span>بالغين: {familyAdultsEntered}</span>
              <span>أطفال: {familyChildrenEntered}</span>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold">
              سعة مفتوحة بدون تقييد
            </div>
          </div>
        </div>

        {/* 5. Prevented Over-Capacity Attempts */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-rose-500/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              تجاوزات تم صدها
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono">
            {totalRejectedAttempts}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-[10px] text-stone-500 dark:text-stone-400">
            محاولات دخول بأكثر من المقاعد تم رفضها آلياً
          </div>
        </div>

        {/* 6. Total Cards Registered */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
              إجمالي البطاقات
            </span>
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-2 font-mono">
            {guests.length}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-[10px] text-stone-500 dark:text-stone-400">
            {guests.filter((g) => g.enteredSeats > 0).length} بطاقة حضرت
          </div>
        </div>
      </div>

      {/* Category Summary Breakdown Box */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <span>توزيع الحضور والمتبقي حسب فئات الضيوف</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VIP */}
          {(() => {
            const vips = guests.filter((g) => g.category === 'vip');
            const vAllowed = vips.reduce((s, g) => s + g.maxSeats, 0);
            const vEntered = vips.reduce((s, g) => s + g.enteredSeats, 0);
            const vRemaining = Math.max(0, vAllowed - vEntered);
            return (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-800 dark:text-amber-200">
                    ⭐ كبار الشخصيات (VIP)
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                    {vips.length} بطاقات
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">حضر: <strong className="text-emerald-600">{vEntered}</strong></span>
                  <span className="text-stone-500">متبقي: <strong className="text-amber-600">{vRemaining}</strong></span>
                  <span className="text-stone-500">إجمالي: <strong>{vAllowed}</strong></span>
                </div>
              </div>
            );
          })()}

          {/* Groom Family */}
          {(() => {
            const groomFamily = guests.filter((g) => g.category === 'family_groom');
            const entered = groomFamily.reduce((s, g) => s + g.enteredSeats, 0);
            return (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-stone-800/80 border border-amber-300 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    👑 عائلة العريس (أهل الحفل)
                  </span>
                  <span className="text-[10px] bg-amber-200 text-stone-900 px-2 py-0.5 rounded-full font-bold">
                    سعة مفتوحة
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">دخل: <strong className="text-emerald-600">{entered} شخص</strong></span>
                  <span className="text-emerald-600 font-bold">ميزانية غير مقيدة</span>
                </div>
              </div>
            );
          })()}

          {/* Bride Family */}
          {(() => {
            const brideFamily = guests.filter((g) => g.category === 'family_bride');
            const entered = brideFamily.reduce((s, g) => s + g.enteredSeats, 0);
            return (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-stone-800/80 border border-amber-300 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    👑 عائلة العروس (أهل الحفل)
                  </span>
                  <span className="text-[10px] bg-amber-200 text-stone-900 px-2 py-0.5 rounded-full font-bold">
                    سعة مفتوحة
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">دخل: <strong className="text-emerald-600">{entered} شخص</strong></span>
                  <span className="text-emerald-600 font-bold">ميزانية غير مقيدة</span>
                </div>
              </div>
            );
          })()}

          {/* Friends & General */}
          {(() => {
            const others = guests.filter((g) => g.category === 'friends' || g.category === 'general');
            const oAllowed = others.reduce((s, g) => s + g.maxSeats, 0);
            const oEntered = others.reduce((s, g) => s + g.enteredSeats, 0);
            const oRemaining = Math.max(0, oAllowed - oEntered);
            return (
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    👥 الأصدقاء والمدعوون العامون
                  </span>
                  <span className="text-[10px] bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full font-bold">
                    {others.length} بطاقات
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">حضر: <strong className="text-emerald-600">{oEntered}</strong></span>
                  <span className="text-stone-500">متبقي: <strong className="text-amber-600">{oRemaining}</strong></span>
                  <span className="text-stone-500">إجمالي: <strong>{oAllowed}</strong></span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Comprehensive Detailed Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المدعو أو الكود..."
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">كافة الفئات</option>
              <option value="family_groom">أهل العريس (مفتوح)</option>
              <option value="family_bride">أهل العروس (مفتوح)</option>
              <option value="vip">كبار الشخصيات VIP</option>
              <option value="friends">الأصدقاء</option>
              <option value="general">عام</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">كافة الحالات</option>
              <option value="unlimited">أهل الحفل (مفتوح)</option>
              <option value="not_arrived">لم يدخل بعد</option>
              <option value="partially_arrived">حضور جزئي (متبقي مقاعد)</option>
              <option value="fully_arrived">اكتمل الحضور (مستهلك)</option>
            </select>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-100 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4">المدعو</th>
                <th className="py-3 px-3">الفئة</th>
                <th className="py-3 px-3 text-center">مسموح بالغين</th>
                <th className="py-3 px-3 text-center">مسموح أطفال</th>
                <th className="py-3 px-3 text-center">إجمالي السعة</th>
                <th className="py-3 px-3 text-center">الذين دخلوا</th>
                <th className="py-3 px-3 text-center">المتبقي للدخول</th>
                <th className="py-3 px-3 text-center">محاولات مرفوضة</th>
                <th className="py-3 px-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    لا يوجد نتائج مطابقة للبحث أو الفلتر
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const isUnlimited = isGuestUnlimited(guest);
                  const remAdults = getGuestAdultsRemaining(guest);
                  const remChildren = getGuestChildrenRemaining(guest);
                  const remTotal = isUnlimited ? 'مفتوح ∞' : Math.max(0, guest.maxSeats - guest.enteredSeats);

                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-2">
                          <span>{guest.name}</span>
                          <span className="font-mono text-[10px] text-stone-400">#{guest.code}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {isUnlimited ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300">
                            👑 أهل الحفل (مفتوح)
                          </span>
                        ) : guest.category === 'vip' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200">
                            ⭐ VIP
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            {guest.category === 'friends' ? 'أصدقاء' : 'عام'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-stone-700 dark:text-stone-300">
                        {isUnlimited ? 'مفتوح' : (guest.adultsAllowed ?? guest.maxSeats)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-teal-600 dark:text-teal-400">
                        {isUnlimited ? 'مفتوح' : (guest.childrenAllowed ?? 0)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-stone-900 dark:text-stone-100">
                        {isUnlimited ? 'مفتوح ∞' : guest.maxSeats}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {guest.enteredSeats}
                        </span>
                        {!isUnlimited && (
                          <span className="text-[10px] text-stone-400 block">
                            ({guest.adultsEntered ?? 0} كبار + {guest.childrenEntered ?? 0} أطفال)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {isUnlimited ? (
                          <span className="text-emerald-600 font-bold text-xs">مفتوح دائماً</span>
                        ) : remTotal === 0 ? (
                          <span className="text-rose-600 font-bold text-xs">0 (مكتمل)</span>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                              {remTotal}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              ({remAdults} كبار + {remChildren} أطفال)
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {(guest.rejectedAttempts ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                            <ShieldAlert className="w-3 h-3" />
                            {guest.rejectedAttempts} صدّ
                          </span>
                        ) : (
                          <span className="text-stone-300 dark:text-stone-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isUnlimited ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            سعة مفتوحة
                          </span>
                        ) : guest.enteredSeats === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500">
                            لم يحضر بعد
                          </span>
                        ) : remTotal === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            اكتمل الحضور
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            حضور جزئي
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
