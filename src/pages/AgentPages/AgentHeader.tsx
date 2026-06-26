import React from 'react';
import { useNavigate } from 'react-router-dom';
import AgentBrand from './AgentBrand';
import { agentLogout } from '../../services/agentApi';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentHeader: React.FC<{ active?: 'campaigns' | 'dashboard'; userName?: string | null; showNav?: boolean }> = ({ active, userName, showNav = true }) => {
    const navigate = useNavigate();
    const go = (sub: string) => navigate(LOCAL_PATH_PREFIX + sub);
    const signOut = () => { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); };
    const linkCls = (on: boolean) => `text-sm ${on ? 'font-semibold text-campaign' : 'text-slate-500 hover:text-slate-700'}`;
    const tabCls = (on: boolean) => `flex-1 py-3 text-center text-sm font-semibold ${on ? 'text-campaign' : 'text-slate-500'}`;
    return (
        <>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
                <div className="flex items-center gap-5">
                    <AgentBrand />
                    {showNav && (
                        <nav className="hidden sm:flex items-center gap-4">
                            <button type="button" onClick={() => go('')} className={linkCls(active === 'campaigns')}>Campaigns</button>
                            <button type="button" onClick={() => go('dashboard')} className={linkCls(active === 'dashboard')}>Dashboard</button>
                        </nav>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {userName && <span className="hidden sm:inline text-sm text-slate-500">{userName}</span>}
                    <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
                </div>
            </header>
            {showNav && (
                <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-slate-200 bg-white">
                    <button type="button" onClick={() => go('')} className={tabCls(active === 'campaigns')}>Campaigns</button>
                    <button type="button" onClick={() => go('dashboard')} className={tabCls(active === 'dashboard')}>Dashboard</button>
                </nav>
            )}
        </>
    );
};

export default AgentHeader;
