import React from 'react';
import { LayoutDashboard, Coins, Crosshair } from 'lucide-react';
import type { TabId } from '../types/investments';

interface TabSelectorProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  cryptoCount: number;
  skinsCount: number;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  activeTab,
  onTabChange,
  cryptoCount,
  skinsCount,
}) => {
  const tabs = [
    {
      id: 'overview' as TabId,
      label: 'Resumen General',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'crypto' as TabId,
      label: 'Criptomonedas',
      icon: Coins,
      badge: cryptoCount,
    },
    {
      id: 'skins' as TabId,
      label: 'CS Skins',
      icon: Crosshair,
      badge: skinsCount,
    },
  ];

  return (
    <div className="flex border-b border-zinc-800 bg-zinc-900/50 rounded-xl p-1.5 gap-1.5 sm:gap-2 max-w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            />
            <span>{tab.label}</span>
            {tab.badge !== null && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'bg-zinc-800/80 text-zinc-500'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
