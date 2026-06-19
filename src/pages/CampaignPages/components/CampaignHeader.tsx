import React from 'react';

type CampaignHeaderProps = {
  title?: string;
  right?: React.ReactNode;
};

export function CampaignHeader({ title, right }: CampaignHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-8 sm:h-9 w-auto" />
          {title && (
            <span className="text-sm sm:text-base font-semibold text-slate-900 border-l border-slate-200 pl-3">
              {title}
            </span>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
