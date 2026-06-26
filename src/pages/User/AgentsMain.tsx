import React, { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { getAdminAgents, approveAgent, setAgentStatus } from '../../services/api';

interface AdminAgent { id: number; name: string; email: string; country_code?: string | null; phone_no?: string | null; status?: string | null; onboarded_at?: string | null; agent_approved_at?: string | null; }

const AgentsMain: React.FC = () => {
    const [agents, setAgents] = useState<AdminAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = async () => {
        const res = await getAdminAgents();
        const list = (res?.data ?? res ?? []) as AdminAgent[];
        setAgents(Array.isArray(list) ? list : []);
    };

    useEffect(() => { load().catch(() => toast.error('Failed to load agents.')).finally(() => setLoading(false)); }, []);

    const run = async (id: number, fn: () => Promise<{ success?: boolean; message?: string } | undefined>, okMsg: string) => {
        setBusyId(id);
        try {
            const res = await fn();
            if (res && res.success === false) { toast.error(res.message || 'Action failed.'); }
            else { toast.success(okMsg); await load(); }
        } catch { toast.error('Action failed.'); }
        finally { setBusyId(null); }
    };

    const approve = (a: AdminAgent) => run(a.id, () => approveAgent(a.id), 'Agent approved.');
    const reject = (a: AdminAgent) => { if (!window.confirm(`Reject ${a.name || a.email}? They won't be able to log in.`)) return; run(a.id, () => setAgentStatus(a.id, 'inactive'), 'Agent rejected.'); };
    const deactivate = (a: AdminAgent) => { if (!window.confirm(`Deactivate ${a.name || a.email}?`)) return; run(a.id, () => setAgentStatus(a.id, 'inactive'), 'Agent deactivated.'); };
    const reactivate = (a: AdminAgent) => run(a.id, () => setAgentStatus(a.id, 'active'), 'Agent reactivated.');

    const Badge = ({ ok, yes, no }: { ok: boolean; yes: string; no: string }) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{ok ? yes : no}</span>
    );

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Agents</h1>
            {loading ? (
                <div className="py-10 text-center text-gray-400">Loading…</div>
            ) : agents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">No agents yet.</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold">Email</th>
                                <th className="px-4 py-3 font-semibold">Phone</th>
                                <th className="px-4 py-3 font-semibold">Approval</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agents.map((a) => {
                                const active = a.status === 'active';
                                const approved = !!a.agent_approved_at;
                                const busy = busyId === a.id;
                                return (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 text-gray-900">{a.name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{a.email}</td>
                                        <td className="px-4 py-3 text-gray-600">{a.phone_no ? `+${a.country_code || ''} ${a.phone_no}` : '-'}</td>
                                        <td className="px-4 py-3"><Badge ok={approved} yes="Approved" no="Pending" /></td>
                                        <td className="px-4 py-3"><Badge ok={active} yes="Active" no="Inactive" /></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!active ? (
                                                    <button type="button" disabled={busy} onClick={() => reactivate(a)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? '…' : 'Reactivate'}</button>
                                                ) : !approved ? (
                                                    <>
                                                        <button type="button" disabled={busy} onClick={() => approve(a)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? '…' : 'Approve'}</button>
                                                        <button type="button" disabled={busy} onClick={() => reject(a)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50">Reject</button>
                                                    </>
                                                ) : (
                                                    <button type="button" disabled={busy} onClick={() => deactivate(a)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50">{busy ? '…' : 'Deactivate'}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentsMain;
