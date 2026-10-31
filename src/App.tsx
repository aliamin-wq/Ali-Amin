import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GuardScanner } from './components/GuardScanner';
import { InvitationCard } from './components/InvitationCard';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { LiveCheckInFeed } from './components/LiveCheckInFeed';
import { Guest, EventDetails } from './types/invitation';
import { NewCardGeneratedModal } from './components/NewCardGeneratedModal';
import { 
  loadEventDetails, 
  saveEventDetails, 
  loadGuests, 
  saveGuests 
} from './utils/storage';
import { soundFx } from './utils/audio';
import { ShieldCheck, Ticket, Users, History, CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [event, setEvent] = useState<EventDetails>(loadEventDetails);
  const [guests, setGuests] = useState<Guest[]>(loadGuests);
  const [activeTab, setActiveTab] = useState<'scanner' | 'card' | 'organizer' | 'logs'>('scanner');
  const [selectedCardGuestId, setSelectedCardGuestId] = useState<string>(() => {
    const list = loadGuests();
    return list[0]?.id || 'G-101';
  });
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState<boolean>(false);
  const [newlyCreatedGuest, setNewlyCreatedGuest] = useState<Guest | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    saveEventDetails(event);
  }, [event]);

  useEffect(() => {
    saveGuests(guests);
  }, [guests]);

  // Check for ticket param in URL (when guest or guard scans QR with normal phone camera)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ticketToken = params.get('ticket');
      if (ticketToken) {
        const found = guests.find(
          (g) =>
            g.invitationUrlToken === ticketToken ||
            g.code === ticketToken ||
            g.id.toLowerCase() === ticketToken.toLowerCase()
        );
        if (found) {
          setSelectedCardGuestId(found.id);
          setActiveTab('card');
        }
      }
    }
  }, [guests]);

  // Toggle Mute
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      soundFx.isMuted = next;
      return next;
    });
  };

  // Update a single guest
  const handleUpdateGuest = (updated: Guest) => {
    setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  // Add a new guest with auto-generated 4-digit code and token
  const handleAddGuest = (
    newGuestData: Omit<Guest, 'id' | 'code' | 'invitationUrlToken' | 'enteredSeats' | 'status' | 'checkInHistory'>
  ) => {
    // Generate unique 4 digit code
    const existingCodes = new Set(guests.map((g) => g.code));
    let code = Math.floor(1000 + Math.random() * 9000).toString();
    while (existingCodes.has(code)) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const nextIdNum = guests.length + 101;
    const id = `G-${nextIdNum}`;
    const token = `inv_${id.toLowerCase()}_${code}`;

    const newGuest: Guest = {
      ...newGuestData,
      id,
      code,
      invitationUrlToken: token,
      enteredSeats: 0,
      status: 'not_arrived',
      checkInHistory: [],
    };

    setGuests((prev) => [newGuest, ...prev]);
    setSelectedCardGuestId(id);
    setNewlyCreatedGuest(newGuest);
  };

  // Delete guest
  const handleDeleteGuest = (id: string) => {
    const target = guests.find((g) => g.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من حذف المدعو "${target.name}" وبطاقته؟`)) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
      if (selectedCardGuestId === id) {
        const remaining = guests.filter((g) => g.id !== id);
        if (remaining.length > 0) {
          setSelectedCardGuestId(remaining[0].id);
        }
      }
    }
  };

  // Simulate scan by opening guard scanner with that guest
  const handleSimulateGuardScan = (guest: Guest) => {
    setActiveTab('scanner');
  };

  const currentCardGuest = guests.find((g) => g.id === selectedCardGuestId) || guests[0];

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddGuest={() => setIsAddGuestModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Quick Role & Workflow Explainer Pill */}
      <div className="no-print bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold">💡 آلية عمل النظام:</span>
          <span>1. المنظم ينشئ كرت الدعوة برمز QR وباركود مباشر.</span>
          <span>·</span>
          <span>2. الحارس يمسح الرمز؛ يظهر له عدد المسموح به والمتبقي.</span>
          <span>·</span>
          <span className="font-semibold text-rose-700 dark:text-rose-300">
            3. إذا زاد عدد الداخلين عن المقاعد المتاحة يُرفض فوراً مع جرس تنبيه! (مع استثناء عائلة العريس والعروس بسعة مفتوحة).
          </span>
          <span>·</span>
          <span className="font-bold text-emerald-800 dark:text-emerald-300">
            📲 إشعارات الدخول الفورية متصلة بواتساب المضيف تلقائياً
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <GuardScanner
            event={event}
            guests={guests}
            onUpdateGuest={handleUpdateGuest}
            onNavigateToCard={(guestId) => {
              setSelectedCardGuestId(guestId);
              setActiveTab('card');
            }}
          />
        )}

        {activeTab === 'card' && currentCardGuest && (
          <InvitationCard
            event={event}
            guest={currentCardGuest}
            allGuests={guests}
            onSelectGuest={(id) => setSelectedCardGuestId(id)}
            onSimulateGuardScan={handleSimulateGuardScan}
          />
        )}

        {activeTab === 'organizer' && (
          <OrganizerDashboard
            event={event}
            guests={guests}
            onUpdateEvent={setEvent}
            onUpdateGuest={handleUpdateGuest}
            onAddGuest={handleAddGuest}
            onDeleteGuest={handleDeleteGuest}
            onViewGuestCard={(id) => {
              setSelectedCardGuestId(id);
              setActiveTab('card');
            }}
            onSimulateGuardScan={handleSimulateGuardScan}
            isAddModalOpen={isAddGuestModalOpen}
            onCloseAddModal={() => setIsAddGuestModalOpen(false)}
            onOpenAddModal={() => setIsAddGuestModalOpen(true)}
          />
        )}

        {activeTab === 'logs' && (
          <LiveCheckInFeed
            event={event}
            guests={guests}
            onUpdateGuest={handleUpdateGuest}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}
      </main>

      {/* Instant Barcode & QR Popup Modal upon creating a guest */}
      <NewCardGeneratedModal
        guest={newlyCreatedGuest}
        event={event}
        isOpen={Boolean(newlyCreatedGuest)}
        onClose={() => setNewlyCreatedGuest(null)}
        onViewFullCard={(guestId) => {
          setSelectedCardGuestId(guestId);
          setActiveTab('card');
          setNewlyCreatedGuest(null);
        }}
        onAddNewAnother={() => {
          setNewlyCreatedGuest(null);
          setIsAddGuestModalOpen(true);
        }}
      />

      {/* Quiet Footer */}
      <footer className="no-print mt-auto py-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            نظام بوابة الدعوات الذكية © 2026 · فحص الباركود والـ QR وضبط سعة الحضور
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>متوافق مع كاميرات الهواتف الذكية وأجهزة المسح الضوئي</span>
            <span>·</span>
            <span>تنبيهات صوتية فورية</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
