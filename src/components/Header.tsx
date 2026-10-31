import React from 'react';
import { ShieldCheck, Ticket, Users, History, Volume2, VolumeX, UserPlus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'scanner' | 'card' | 'organizer' | 'logs';
  onSelectTab: (tab: 'scanner' | 'card' | 'organizer' | 'logs') => void;
  onOpenAddGuest: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddGuest,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <button
              onClick={() => onSelectTab('scanner')}
              className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap hover:opacity-90 text-right"
            >
              بوابة الدخول الذكية
            </button>
          </div>

          {/* Zone 2: 4 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300">
            <button
              onClick={() => onSelectTab('scanner')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'scanner'
                  ? 'border-amber-600 text-stone-950 dark:text-white font-semibold'
                  : 'border-transparent hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>شاشة الحارس والماسح</span>
            </button>

            <button
              onClick={() => onSelectTab('card')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'card'
                  ? 'border-amber-600 text-stone-950 dark:text-white font-semibold'
                  : 'border-transparent hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4 text-stone-500" />
              <span>بطاقة المدعو (QR)</span>
            </button>

            <button
              onClick={() => onSelectTab('organizer')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'organizer'
                  ? 'border-amber-600 text-stone-950 dark:text-white font-semibold'
                  : 'border-transparent hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-stone-500" />
              <span>إدارة الضيوف والمقاعد</span>
            </button>

            <button
              onClick={() => onSelectTab('logs')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'logs'
                  ? 'border-amber-600 text-stone-950 dark:text-white font-semibold'
                  : 'border-transparent hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-stone-500" />
              <span>سجل الحضور المباشر</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action + Sound control */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
              className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
            </button>

            <button
              onClick={onOpenAddGuest}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مدعو جديد</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-stone-100 dark:border-stone-800/80 text-xs">
          <button
            onClick={() => onSelectTab('scanner')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'scanner' ? 'text-amber-700 font-bold bg-amber-50 dark:bg-amber-950/40' : 'text-stone-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>الحارس</span>
          </button>
          <button
            onClick={() => onSelectTab('card')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'card' ? 'text-amber-700 font-bold bg-amber-50 dark:bg-amber-950/40' : 'text-stone-600'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>البطاقة</span>
          </button>
          <button
            onClick={() => onSelectTab('organizer')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'organizer' ? 'text-amber-700 font-bold bg-amber-50 dark:bg-amber-950/40' : 'text-stone-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الضيوف</span>
          </button>
          <button
            onClick={() => onSelectTab('logs')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              activeTab === 'logs' ? 'text-amber-700 font-bold bg-amber-50 dark:bg-amber-950/40' : 'text-stone-600'
            }`}
          >
            <History className="w-4 h-4" />
            <span>السجل</span>
          </button>
        </div>
      </div>
    </header>
  );
};
