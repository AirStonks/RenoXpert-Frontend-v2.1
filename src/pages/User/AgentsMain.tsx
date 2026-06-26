import React, { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { getAdminAgents, approveAgent } from '../../services/api';

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

    const approve = async (a: AdminAgent) => {
        setBusyId(a.id);
        try {
            const res = await approveAgent(a.id);
            if (res && res.success === false) { toast.error(res.message || 'Approve failed.'); }
            else { toast.success('Agent approved.'); await load(); }
        } catch { toast.error('Approve failed.'); }
        finally { setBusyId(null); }
    };

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
                                <th className="px-4 py-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agents.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 text-gray-900">{a.name || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{a.phone_no ? `+${a.country_code || ''} ${a.phone_no}` : '-'}</td>
                                    <td className="px-4 py-3">
                                        {a.agent_approved_at
                                            ? <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Approved</span>
                                            : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Pending</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!a.agent_approved_at && (
                                            <button type="button" disabled={busyId === a.id} onClick={() => approve(a)}
                                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                                                {busyId === a.id ? 'Approving…' : 'Approve'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentsMain;
