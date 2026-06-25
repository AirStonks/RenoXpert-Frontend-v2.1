import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { agentGoogleLogin } from '../../services/agentApi';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentLogin: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <h1 className="text-xl font-bold text-slate-900">Agent Portal</h1>
                <p className="mt-1 mb-6 text-sm text-slate-500">Sign in with Google to continue</p>
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={async (cred) => {
                            const credential = cred.credential;
                            if (!credential) { toast.error('Google sign-in failed.'); return; }
                            setLoading(true);
                            try {
                                const res = await agentGoogleLogin(credential);
                                navigate(LOCAL_PATH_PREFIX + (res.needs_onboarding ? 'onboarding' : ''));
                            } catch (e: unknown) {
                                const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
                                toast.error(msg || 'Sign-in failed.');
                            } finally { setLoading(false); }
                        }}
                        onError={() => toast.error('Google sign-in failed.')}
                    />
                </div>
                {loading && <p className="mt-4 text-xs text-slate-400">Signing you in…</p>}
            </div>
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentLogin;
