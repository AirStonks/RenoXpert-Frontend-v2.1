import React from 'react';

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_rgba(16,24,40,0.06)]';

export function Card({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 ${CARD_SHADOW} ${className}`} {...rest}>
      {children}
    </div>
  );
}
