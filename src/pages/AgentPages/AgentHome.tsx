import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentLogout, getAgentUser, AgentUser } from '../../services/agentApi';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentHome: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<AgentUser | null>(null);

    useEffect(() => {
        let active = true;
        getAgentUser().then((u) => {
            if (!active) return;
            if (!u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX + 'onboarding', { replace: true }); return; }
            setUser(u);
        }).catch(() => { navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); });
        return () => { active = false; };
    }, [navigate]);

    const signOut = () => { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <span className="font-bold text-slate-900">Agent Portal</span>
                <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
            </header>
            <main className="mx-auto max-w-3xl px-6 py-10">
                <h1 className="text-2xl font-bold text-slate-900">Welcome{user?.name ? `, ${user.name}` : ''}.</h1>
                <p className="mt-2 text-slate-500">Your campaigns will appear here soon.</p>
            </main>
        </div>
    );
};

export default AgentHome;
