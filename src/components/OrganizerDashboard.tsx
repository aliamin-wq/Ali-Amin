import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building,
  Calendar,
  Sparkles,
  Phone,
  FileSpreadsheet,
  Settings,
  MessageCircle,
  QrCode
} from 'lucide-react';
import { Guest, EventDetails, GuestCategory, isGuestUnlimited } from '../types/invitation';

interface OrganizerDashboardProps {
  event: EventDetails;
  guests: Guest[];
  onUpdateEvent: (updated: EventDetails) => void;
  onUpdateGuest: (updated: Guest) => void;
  onAddGuest: (newGuest: Omit<Guest, 'id' | 'code' | 'invitationUrlToken' | 'enteredSeats' | 'status' | 'checkInHistory'>) => void;
  onDeleteGuest: (id: string) => void;
  onViewGuestCard: (id: string) => void;
  onSimulateGuardScan: (guest: Guest) => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  event,
  guests,
  onUpdateEvent,
  onUpdateGuest,
  onAddGuest,
  onDeleteGuest,
  onViewGuestCard,
  onSimulateGuardScan,
  isAddModalOpen,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isEditEventOpen, setIsEditEventOpen] = useState<boolean>(false);

  // Form states for adding/editing guest
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<GuestCategory>('general');
  const [formAdults, setFormAdults] = useState<number>(2);
  const [formChildren, setFormChildren] = useState<number>(0);
  const [formIsUnlimited, setFormIsUnlimited] = useState<boolean>(false);
  const [formPhone, setFormPhone] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Event Edit State
  const [eventTitle, setEventTitle] = useState<string>(event.title);
  const [eventSubtitle, setEventSubtitle] = useState<string>(event.subtitle);
  const [eventDate, setEventDate] = useState<string>(event.dateGregorian);
  const [eventTime, setEventTime] = useState<string>(event.timeString);
  const [eventVenue, setEventVenue] = useState<string>(event.venueName);
  const [eventNotice, setEventNotice] = useState<string>(event.strictCapacityNotice);
  const [eventWhatsApp, setEventWhatsApp] = useState<string>(event.hostWhatsAppNumber || '9647873339946');
  const [eventAutoNotify, setEventAutoNotify] = useState<boolean>(event.autoNotifyHostOnEntry ?? true);
  const [eventTotalSeats, setEventTotalSeats] = useState<number>(event.totalSeats || 300);

  // Total Statistics Calculations (Hall Capacity = 300 Seats)
  const hallCapacity = event.totalSeats || 300;
  const totalCards = guests.length;
  const standardGuests = guests.filter((g) => !isGuestUnlimited(g));
  const totalAllocatedSeats = standardGuests.reduce((sum, g) => sum + g.maxSeats, 0);
  const totalEnteredSeats = guests.reduce((sum, g) => sum + g.enteredSeats, 0);
  const hallRemainingSeats = Math.max(0, hallCapacity - totalEnteredSeats);
  const totalRemainingSeats = Math.max(0, totalAllocatedSeats - totalEnteredSeats);
  const occupancyPercentage = Math.min(100, Math.round((totalEnteredSeats / hallCapacity) * 100));

  // Filter Guests
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.includes(searchQuery) ||
      (g.phone && g.phone.includes(searchQuery));

    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'not_arrived' && g.enteredSeats === 0) ||
      (selectedStatus === 'partially_arrived' && g.enteredSeats > 0 && g.enteredSeats < g.maxSeats) ||
      (selectedStatus === 'fully_arrived' && g.enteredSeats >= g.maxSeats);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmitNewGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const isFamily = formIsUnlimited || formCategory === 'family_groom' || formCategory === 'family_bride';
    const adults = isFamily ? 999 : Math.max(1, formAdults);
    const children = isFamily ? 999 : Math.max(0, formChildren);

    onAddGuest({
      name: formName.trim(),
      category: isFamily ? (formCategory === 'general' ? 'family_groom' : formCategory) : formCategory,
      maxSeats: isFamily ? 999 : (adults + children),
      adultsAllowed: adults,
      adultsEntered: 0,
      childrenAllowed: children,
      childrenEntered: 0,
      isUnlimited: isFamily,
      phone: formPhone.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    // Reset Form
    setFormName('');
    setFormCategory('general');
    setFormAdults(2);
    setFormChildren(0);
    setFormIsUnlimited(false);
    setFormPhone('');
    setFormNotes('');
    onCloseAddModal();
  };

  const handleStartEdit = (g: Guest) => {
    setEditingGuest(g);
    setFormName(g.name);
    setFormCategory(g.category);
    setFormAdults(g.adultsAllowed ?? g.maxSeats);
    setFormChildren(g.childrenAllowed ?? 0);
    setFormIsUnlimited(isGuestUnlimited(g));
    setFormPhone(g.phone || '');
    setFormNotes(g.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest || !formName.trim()) return;

    const isFamily = formIsUnlimited || formCategory === 'family_groom' || formCategory === 'family_bride';
    const adults = isFamily ? 999 : Math.max(editingGuest.adultsEntered ?? 0, formAdults);
    const children = isFamily ? 999 : Math.max(editingGuest.childrenEntered ?? 0, formChildren);

    const updated: Guest = {
      ...editingGuest,
      name: formName.trim(),
      category: formCategory,
      isUnlimited: isFamily,
      adultsAllowed: adults,
      childrenAllowed: children,
      maxSeats: isFamily ? 999 : (adults + children),
      phone: formPhone.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    onUpdateGuest(updated);
    setEditingGuest(null);
  };

  const handleResetCheckIn = (guest: Guest) => {
    if (window.confirm(`هل أنت متأكد من تصفير حضور "${guest.name}" وإعادة المقاعد إلى الحالة الأولى؟`)) {
      onUpdateGuest({
        ...guest,
        enteredSeats: 0,
        status: 'not_arrived',
        checkInHistory: [],
      });
    }
  };

  const handleSaveEventDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEvent({
      ...event,
      title: eventTitle,
      subtitle: eventSubtitle,
      dateGregorian: eventDate,
      timeString: eventTime,
      venueName: eventVenue,
      strictCapacityNotice: eventNotice,
      hostWhatsAppNumber: eventWhatsApp.trim() || '9647873339946',
      autoNotifyHostOnEntry: eventAutoNotify,
      totalSeats: eventTotalSeats || 300,
    });
    setIsEditEventOpen(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['المعرف', 'كود الدعوة', 'اسم المدعو', 'الفئة', 'المقاعد المسموح بها', 'الداخلون', 'المتبقي', 'رقم الهاتف', 'ملاحظات'];
    const rows = guests.map((g) => [
      g.id,
      g.code,
      `"${g.name.replace(/"/g, '""')}"`,
      g.category,
      g.maxSeats,
      g.enteredSeats,
      g.maxSeats - g.enteredSeats,
      g.phone || '',
      `"${(g.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قائمة_المدعوين_${event.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Event Banner with Grand Hall Backdrop */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800 bg-stone-900 text-white min-h-[200px] flex items-end">
        <img
          src="/src/assets/images/venue_festive_hall_1793449775683.jpg"
          alt="Festive Banquet Hall"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>إدارة المناسبة وقاعة الاحتفال</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white">
              {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              {event.subtitle} · {event.venueName} · <span className="text-amber-300 font-bold">سعة القاعة: {hallCapacity} مقعد</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditEventOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>تعديل بيانات الحفل</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مدعو</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time KPI Stats Ribbon with 300 Hall Seats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hall Total Capacity (300 seats) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>إجمالي سعة مقاعد القاعة</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {hallCapacity} <span className="text-sm font-sans font-medium text-stone-500">مقعد</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            المتبقي شاغر بالقاعة: {hallRemainingSeats} مقعد
          </div>
        </div>

        {/* Total Checked-In */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
            <span>الحاضرون فعلياً بالقاعة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {totalEnteredSeats}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            نسبة إشغال القاعة: {occupancyPercentage}% من {hallCapacity}
          </div>
        </div>

        {/* Allocated Seats in Cards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>المقاعد المخصصة بالبطاقات</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {totalAllocatedSeats}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            موزعة على {totalCards} بطاقة دعوة
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>مؤشر امتلاء القاعة (300 مقعد)</span>
            <span className="font-mono font-bold text-stone-900 dark:text-white">{occupancyPercentage}%</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-3 overflow-hidden my-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercentage >= 90
                  ? 'bg-rose-500'
                  : occupancyPercentage >= 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
            />
          </div>
          <div className="text-[11px] text-stone-400">
            {totalEnteredSeats} حاضرون من أصل {hallCapacity} مقعد
          </div>
        </div>
      </div>

      {/* Guest Management Table Header & Filters */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              قائمة المدعوين وضبط السعة ({filteredGuests.length})
            </h2>
            <p className="text-xs text-stone-500">
              يمكنك متابعة وتعديل عدد المرافقين المسموح بهم وتوليد بطاقة QR لكل مدعو
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الكود..."
                className="w-full h-9 pr-9 pl-3 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none font-medium"
            >
              <option value="all">كل الفئات</option>
              <option value="vip">كبار الشخصيات (VIP)</option>
              <option value="family_groom">عائلة العريس</option>
              <option value="family_bride">عائلة العروس</option>
              <option value="friends">الأصدقاء</option>
              <option value="general">عام</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none font-medium"
            >
              <option value="all">كل الحالات</option>
              <option value="not_arrived">لم يحضروا بعد</option>
              <option value="partially_arrived">دخول جزئي</option>
              <option value="fully_arrived">اكتمل الدخول</option>
            </select>

            {/* CSV Export */}
            <button
              onClick={handleExportCsv}
              className="h-9 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-semibold">
              <tr>
                <th className="py-3 px-4">كود الدعوة</th>
                <th className="py-3 px-4">اسم المدعو</th>
                <th className="py-3 px-4">الفئة</th>
                <th className="py-3 px-4 text-center">المقاعد المسموحة</th>
                <th className="py-3 px-4 text-center">الداخلون</th>
                <th className="py-3 px-4 text-center">المتبقي</th>
                <th className="py-3 px-4">حالة البوابة</th>
                <th className="py-3 px-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredGuests.length > 0 ? (
                filteredGuests.map((g) => {
                  const remaining = Math.max(0, g.maxSeats - g.enteredSeats);
                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                        {g.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {g.name}
                        </div>
                        {g.notes && (
                          <div className="text-[11px] text-stone-400">
                            {g.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                          {isGuestUnlimited(g) && '👑 أهل الحفل (مفتوح)'}
                          {!isGuestUnlimited(g) && g.category === 'vip' && '👑 VIP'}
                          {!isGuestUnlimited(g) && g.category === 'friends' && '🤝 أصدقاء'}
                          {!isGuestUnlimited(g) && g.category === 'general' && 'عام'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                        {isGuestUnlimited(g) ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">سعة مفتوحة ∞</span>
                        ) : (
                          g.maxSeats
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-amber-700 dark:text-amber-400">
                        {g.enteredSeats}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {isGuestUnlimited(g) ? 'مفتوح ∞' : remaining}
                      </td>
                      <td className="py-3.5 px-4">
                        {isGuestUnlimited(g) ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            دخول مفتوح دائماً
                          </span>
                        ) : remaining === 0 ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            مستنفدة بالكامل
                          </span>
                        ) : g.enteredSeats > 0 ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            دخول جزئي ({remaining} متبقي)
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            جاهزة للدخول
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewGuestCard(g.id)}
                            title="عرض كرت الدعوة ورمز QR"
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                          >
                            <Ticket className="w-4 h-4 text-amber-600" />
                          </button>

                          <button
                            onClick={() => onSimulateGuardScan(g)}
                            title="فحص عند البوابة"
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </button>

                          <button
                            onClick={() => handleStartEdit(g)}
                            title="تعديل بيانات المدعو"
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                          >
                            <Edit3 className="w-4 h-4 text-stone-500" />
                          </button>

                          {g.enteredSeats > 0 && (
                            <button
                              onClick={() => handleResetCheckIn(g)}
                              title="تصفير الدخول"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteGuest(g.id)}
                            title="حذف المدعو"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    لا يوجد مدعوون يطابقون خيارات البحث الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD GUEST MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <span>إضافة مدعو جديد وتخصيص المقاعد</span>
              </h3>
              <button
                onClick={onCloseAddModal}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewGuest} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-stone-900 dark:text-stone-100 text-sm mb-1">
                  اسم المدعو بالكامل *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: السيد علي أمين"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* 2. Number of seats OR Groom/Bride Family (Open Capacity) */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    2. عدد المقاعد المسموح بها *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !formIsUnlimited;
                      setFormIsUnlimited(next);
                      if (next && formCategory !== 'family_groom' && formCategory !== 'family_bride') {
                        setFormCategory('family_groom');
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      formIsUnlimited
                        ? 'bg-amber-500 text-stone-950 shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-100'
                    }`}
                  >
                    {formIsUnlimited ? '👑 سعة مفتوحة مفعلة (أهل الحفل)' : '👑 أهل الحفل (سعة مفتوحة؟)'}
                  </button>
                </div>

                {formIsUnlimited ? (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-200 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>ميزانية ودخول مفتوح (عائلة العريس أو العروس)</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                      يستطيعون إدخال أي عدد من الضيوف دون تقييد بأرقام وبلا أي رفض عند البوابة.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setFormCategory('family_groom')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          formCategory === 'family_groom'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        💍 عائلة العريس
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCategory('family_bride')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          formCategory === 'family_bride'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        💐 عائلة العروس
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Adults count */}
                      <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60">
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                          <span>👨 عدد البالغين (الكبار)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormAdults((prev) => Math.max(1, prev - 1))}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-bold text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            required
                            value={formAdults}
                            onChange={(e) => setFormAdults(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 h-8 text-center font-mono font-bold text-base rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setFormAdults((prev) => prev + 1)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children count */}
                      <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60">
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                          <span>🧒 عدد الأطفال</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormChildren((prev) => Math.max(0, prev - 1))}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-bold text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            required
                            value={formChildren}
                            onChange={(e) => setFormChildren(Math.max(0, parseInt(e.target.value) || 0))}
                            className="flex-1 h-8 text-center font-mono font-bold text-base rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setFormChildren((prev) => prev + 1)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
                      <span>إجمالي سعة البطاقة:</span>
                      <b className="font-mono text-xs">{formAdults + formChildren} مقاعد ({formAdults} كبار + {formChildren} أطفال)</b>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Phone & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    رقم الهاتف (لإرسال كرت الدعوة عبر واتساب)
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="07873339946"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none text-left"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1">
                    ملاحظات (طاولة، جناح... اختياري)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="طاولة كبار الشخصيات..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>إنشاء الكرت واستلام الباركود فوراً ⚡</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GUEST MODAL */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                تعديل بيانات المدعو: {editingGuest.name}
              </h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  اسم المدعو
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الفئة
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as GuestCategory)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none font-medium"
                  >
                    <option value="vip">كبار الشخصيات (VIP)</option>
                    <option value="family_groom">عائلة العريس</option>
                    <option value="family_bride">عائلة العروس</option>
                    <option value="friends">الأصدقاء</option>
                    <option value="general">عام</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      البالغين المسموح بهم
                    </label>
                    <input
                      type="number"
                      min={editingGuest.adultsEntered ?? 0}
                      required
                      value={formAdults}
                      onChange={(e) => setFormAdults(parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      الأطفال المسموح بهم
                    </label>
                    <input
                      type="number"
                      min={editingGuest.childrenEntered ?? 0}
                      required
                      value={formChildren}
                      onChange={(e) => setFormChildren(parseInt(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none text-left"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  الملاحظات
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT DETAILS MODAL */}
      {isEditEventOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                تعديل بيانات الحفل والبطاقة
              </h3>
              <button
                onClick={() => setIsEditEventOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEventDetails} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  عنوان الحفل / المناسبة
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  الوصف والداعي
                </label>
                <input
                  type="text"
                  required
                  value={eventSubtitle}
                  onChange={(e) => setEventSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    التاريخ
                  </label>
                  <input
                    type="text"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الوقت
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    القاعة ومقر الحفل
                  </label>
                  <input
                    type="text"
                    required
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    إجمالي سعة مقاعد القاعة
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={eventTotalSeats}
                    onChange={(e) => setEventTotalSeats(Math.max(1, parseInt(e.target.value) || 300))}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ملاحظة الالتزام بالعدد (تظهر أسفل كرت الدعوة)
                </label>
                <textarea
                  rows={2}
                  value={eventNotice}
                  onChange={(e) => setEventNotice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {/* Host WhatsApp Notification Config */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <label className="block font-bold text-emerald-900 dark:text-emerald-200">
                  📱 رقم واتساب المضيف لاستلام إشعارات الدخول الفورية
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={eventWhatsApp}
                  onChange={(e) => setEventWhatsApp(e.target.value)}
                  placeholder="009647873339946"
                  className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left focus:outline-none"
                />
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoNotifyCheckbox"
                    checked={eventAutoNotify}
                    onChange={(e) => setEventAutoNotify(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="autoNotifyCheckbox" className="text-stone-700 dark:text-stone-300 cursor-pointer text-[11px]">
                    إرسال إشعار فوري وتلقائي لواتساب المضيف مع كل عملية فحص ودخول عند البوابة
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditEventOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
