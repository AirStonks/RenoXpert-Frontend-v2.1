import React from 'react';
import type { LucideIcon } from 'lucide-react';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
};

export function Field({ label, icon: Icon, id, className = '', ...rest }: FieldProps) {
  const inputId = id || rest.name;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={inputId}
          className={`w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white text-base text-slate-900 placeholder-slate-400 transition focus:outline-none focus:border-campaign focus:ring-2 focus:ring-campaign/30 ${className}`}
          {...rest}
        />
      </div>
    </div>
  );
}
