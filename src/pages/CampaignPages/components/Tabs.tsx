import React from 'react';

type Tab = { key: string; label: React.ReactNode };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`inline-flex gap-1 p-1 bg-slate-100 rounded-xl ${className}`}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isActive ? 'bg-campaign text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
