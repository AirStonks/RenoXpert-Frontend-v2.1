import React from 'react';

type Tone = 'brand' | 'emerald' | 'slate' | 'red' | 'teal';

const TONES: Record<Tone, string> = {
  brand: 'bg-campaign-50 text-campaign',
  emerald: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-600',
  red: 'bg-red-50 text-red-600',
  teal: 'bg-teal-50 text-teal-700',
};

type PillProps = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Pill({ tone = 'brand', className = '', children, ...rest }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
