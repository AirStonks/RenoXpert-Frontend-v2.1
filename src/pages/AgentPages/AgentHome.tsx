import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { agentLogout, getAgentUser, getAgentCampaigns, AgentUser, AgentCampaign } from '../../services/agentApi';
import { buildReferralLink, getCampaignBaseUrl } from '../../utils/referral';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentHome: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<AgentUser | null>(null);
    const [campaigns, setCampaigns] = useState<AgentCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const u = await getAgentUser();
                if (!active) return;
                if (!u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX + 'onboarding', { replace: true }); return; }
                setUser(u);
                const list = await getAgentCampaigns();
                if (!active) return;
                setCampaigns(Array.isArray(list) ? list : []);
            } catch {
                if (active) navigate(LOCAL_PATH_PREFIX + 'login', { replace: true });
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [navigate]);

    const signOut = () => { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); };

    const code = user?.referral_code || '';
    const base = getCampaignBaseUrl();
    const linkFor = (slug: string) => (code ? buildReferralLink(base, slug, code) : '');

    const copy = async (text: string, label: string) => {
        if (!text) { toast.error('No referral code available.'); return; }
        try { await navigator.clipboard.writeText(text); toast.success(label + ' copied.'); }
        catch { toast.error('Copy failed.'); }
    };

    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-50">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
                <span className="font-bold text-slate-900">Agent Portal</span>
                <div className="flex items-center gap-3">
                    {user?.name && <span className="hidden sm:inline text-sm text-slate-500">{user.name}</span>}
                    <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
                {code && (
                    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                        <span className="text-sm text-slate-500">Your referral code</span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-semibold text-slate-800">{code}</span>
                        <button type="button" onClick={() => copy(code, 'Referral code')} className="text-sm font-semibold text-campaign hover:underline">Copy</button>
                    </div>
                )}

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Campaigns</h1>
                <p className="mt-1 mb-6 text-sm text-slate-500">Share your referral link for any campaign below.</p>

                {loading ? (
                    <div className="py-16 text-center text-slate-400">Loading…</div>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No campaigns available yet.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                        {campaigns.map((c) => (
                            <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="aspect-[16/9] w-full bg-slate-100">
                                    {c.thumbnail?.file_url
                                        ? <img src={c.thumbnail.file_url} alt={c.title} className="h-full w-full object-cover" />
                                        : <div className="flex h-full w-full items-center justify-center text-slate-300">No image</div>}
                                </div>
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                                    <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                                        <button type="button" disabled={!code} onClick={() => copy(linkFor(c.slug), 'Referral link')}
                                            className="inline-flex items-center rounded-lg bg-campaign px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                                            Copy referral link
                                        </button>
                                        {code && (
                                            <a href={linkFor(c.slug)} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                                Preview ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentHome;
