import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import { agentLogout, getAgentUser, getAgentReferrals, AgentReferrals } from '../../services/agentApi';
import AgentBrand from './AgentBrand';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';
const currency = (n: number | null) => 'RM ' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '-');

const AgentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [data, setData] = useState<AgentReferrals | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            let u;
            try { u = await getAgentUser(); } catch { if (active) navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); return; }
            if (!active) return;
            if (u && u.status && u.status !== 'active') { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); return; }
            if (!u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX + 'onboarding', { replace: true }); return; }
            if (!u.agent_approved_at) { navigate(LOCAL_PATH_PREFIX, { replace: true }); return; }
            setName(u.name || '');
            try { const r = await getAgentReferrals(); if (active) setData(r); }
            catch { if (active) setLoadError(true); }
            finally { if (active) setLoading(false); }
        })();
        return () => { active = false; };
    }, [navigate]);

    const signOut = () => { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); };

    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-50">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
                <div className="flex items-center gap-4">
                    <AgentBrand />
                    <nav className="flex items-center gap-3 text-sm">
                        <button type="button" onClick={() => navigate(LOCAL_PATH_PREFIX)} className="text-slate-500 hover:text-slate-700">Campaigns</button>
                        <span className="font-semibold text-campaign">Dashboard</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {name && <span className="hidden sm:inline text-sm text-slate-500">{name}</span>}
                    <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Your referrals</h1>

                {loading ? (
                    <div className="py-16 text-center text-slate-400">Loading…</div>
                ) : loadError || !data ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">Couldn't load referrals. Please refresh.</div>
                ) : (
                    <>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Total referred</div><div className="mt-1 text-2xl font-bold text-slate-900">{data.summary.total}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Paid</div><div className="mt-1 text-2xl font-bold text-slate-900">{data.summary.paid}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Total amount</div><div className="mt-1 text-2xl font-bold text-campaign">{currency(data.summary.total_amount)}</div></div>
                        </div>

                        {data.bookings.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No referred bookings yet.</div>
                        ) : (
                            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Campaign</th>
                                            <th className="px-4 py-3 font-semibold">Customer</th>
                                            <th className="px-4 py-3 font-semibold">Date</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.bookings.map((b, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3 text-slate-900">{b.campaign_title || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{b.customer_name || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{fmtDate(b.date)}</td>
                                                <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">{b.status || '-'}</span></td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-900">{currency(b.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentDashboard;
