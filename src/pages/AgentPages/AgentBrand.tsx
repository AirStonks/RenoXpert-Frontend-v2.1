import React from 'react';

const AgentBrand: React.FC<{ showLabel?: boolean; className?: string }> = ({ showLabel = true, className = '' }) => (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
        <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-7 w-auto" />
        {showLabel && <span className="font-bold text-slate-900 hidden sm:inline">Agent Portal</span>}
    </div>
);

export default AgentBrand;
