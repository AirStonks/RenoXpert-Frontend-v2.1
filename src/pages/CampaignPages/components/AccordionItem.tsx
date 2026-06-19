import React from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionItemProps = {
  open: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export function AccordionItem({
  open,
  onToggle,
  header,
  children,
  className = '',
  headerClassName = '',
}: AccordionItemProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${headerClassName}`}
      >
        <div className="flex-1">{header}</div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 ml-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="p-4 sm:p-5 border-t border-slate-100">{children}</div>}
    </div>
  );
}
