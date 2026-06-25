import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { agentOnboarding, getAgentUser } from '../../services/agentApi';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [countryCode, setCountryCode] = useState('+60');
    const [phone, setPhone] = useState('');
    const [agree, setAgree] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        getAgentUser().then((u) => {
            if (!active) return;
            if (u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX, { replace: true }); return; }
            setName(u?.name || '');
        }).catch(() => { navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); });
        return () => { active = false; };
    }, [navigate]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) { toast.error('Phone number is required.'); return; }
        if (!agree) { toast.error('Please agree to the agent terms.'); return; }
        setSaving(true);
        try {
            await agentOnboarding({ name: name.trim() || undefined, country_code: countryCode.trim(), phone_no: phone.trim(), agree_terms: agree });
            navigate(LOCAL_PATH_PREFIX, { replace: true });
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Could not save. Please try again.');
        } finally { setSaving(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Welcome — let's finish setup</h1>
                    <p className="mt-1 text-sm text-slate-500">A couple of details to activate your agent account.</p>
                </div>
                <label className="block text-sm font-medium text-slate-700">Name
                    <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <div className="flex gap-2">
                    <label className="block text-sm font-medium text-slate-700 w-24">Code
                        <input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700 flex-1">Phone *
                        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    I agree to the agent terms & conditions
                </label>
                <button type="submit" disabled={saving} className="w-full rounded-lg bg-campaign px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {saving ? 'Saving…' : 'Continue'}
                </button>
            </form>
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentOnboarding;
