# Agent Google Auth + Onboarding Implementation Plan (Agent Campaign SP4/5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agents sign in with Google (verified server-side), auto-create an `type='agent'` account on first login, complete a simple onboarding (phone + name + T&C), and reach a gated agent area (placeholder — portal content is SP5).

**Architecture:** Backend adds `users.onboarded_at`, a `services.google.client_id` config, and an `AgentAuthController` that verifies the Google ID token via Google's tokeninfo endpoint (existing Guzzle, no new dep) then issues a Sanctum token. Frontend adds `@react-oauth/google`, an agent domain + route group, `a_token` auth, and the login/onboarding/home pages.

**Tech Stack:** Laravel 11 (Sanctum, Guzzle, `BaseController`); React 18 + TS + Vite + `@react-oauth/google`.

## Global Constraints

- **No new backend dependency** (Google verified via existing Guzzle). One new **frontend** dep: `@react-oauth/google`.
- Backend: `users` migration-managed (normal migration). **NEVER run `php artisan migrate`** (user runs it). `php` CLI unavailable → BE manual review. New controller extends `BaseController`; onboarding under `auth:sanctum`.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. BE branch `feature/agent-google-auth` off `origin/production`; FE branch `feature/agent-google-auth` off `production`.
- **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors; new files clean (0); no `any`. No test runner.
- Decisions: tokeninfo verify (check `aud` + `email_verified`); open self-signup (active); onboarding = phone + name + T&C (`onboarded_at`); block non-agent email (422).
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE): Agent Google auth + onboarding

**Repo/branch:** `RenoXpert-Backend`, `feature/agent-google-auth` (off `origin/production`).

**Files:**
- Create: `database/migrations/2026_06_26_000000_add_onboarded_at_to_users_table.php`
- Create: `app/Http/Controllers/AgentAuthController.php`
- Modify: `app/Http/Resources/UserResource.php`; `config/services.php`; `.env`; `routes/api.php`

**Interfaces:**
- Produces: `POST agent/google-login` (public) → `{ token, user, needs_onboarding }`; `POST agent/onboarding` (auth) → user. `users.onboarded_at`.

- [ ] **Step 1: Migration**

Create `database/migrations/2026_06_26_000000_add_onboarded_at_to_users_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('onboarded_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('onboarded_at');
        });
    }
};
```

- [ ] **Step 2: Expose `onboarded_at` + fillable**

In `app/Models/User.php`: add `'onboarded_at',` to `$fillable`. In `app/Http/Resources/UserResource.php`, add after `'status' => $this->status,`:
```php
            'onboarded_at' => $this->onboarded_at,
```

- [ ] **Step 3: Google config**

In `config/services.php`, add before the closing `];`:
```php
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],
```
In `.env`, add a line (real value set by the user later): `GOOGLE_CLIENT_ID=`

- [ ] **Step 4: `AgentAuthController`**

Create `app/Http/Controllers/AgentAuthController.php`:
```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AgentAuthController extends BaseController
{
    public function googleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        // Verify the Google ID token via Google's tokeninfo endpoint (no extra dependency).
        $payload = null;
        try {
            $client = new Client();
            $resp = $client->get('https://oauth2.googleapis.com/tokeninfo', [
                'query' => ['id_token' => $request->input('credential')],
                'http_errors' => false,
            ]);
            if ($resp->getStatusCode() === 200) {
                $payload = json_decode((string) $resp->getBody(), true);
            }
        } catch (\Exception $e) {
            Log::error('Google tokeninfo failed', ['error' => $e->getMessage()]);
        }

        if (!is_array($payload)) {
            return $this->sendError('Invalid Google token.', [], 401);
        }
        if (($payload['aud'] ?? null) !== config('services.google.client_id')) {
            return $this->sendError('Invalid Google token (audience).', [], 401);
        }
        $emailVerified = $payload['email_verified'] ?? false;
        if ($emailVerified !== true && $emailVerified !== 'true') {
            return $this->sendError('Google email not verified.', [], 401);
        }
        $email = $payload['email'] ?? null;
        if (empty($email)) {
            return $this->sendError('Invalid Google token (email).', [], 401);
        }
        $name = $payload['name'] ?? $email;

        $user = User::where('email', $email)->first();
        if ($user) {
            if ($user->type !== 'agent') {
                return $this->sendError('This email is already in use.', [], 422);
            }
        } else {
            $user = new User();
            $user->name = $name;
            $user->email = $email;
            $user->type = 'agent';
            $user->status = 'active';
            $user->password = null;
            $user->save(); // referral_code auto-generated by the creating hook
        }

        $token = $user->createToken('AgentSite')->plainTextToken;

        return $this->sendResponse([
            'token' => $token,
            'user' => new UserResource($user),
            'needs_onboarding' => is_null($user->onboarded_at),
        ], 'Logged in.');
    }

    public function onboarding(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->type !== 'agent') {
            return $this->sendError('Forbidden.', [], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'country_code' => 'required|string|max:8',
            'phone_no' => 'required|string|max:32',
            'agree_terms' => 'accepted',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        if ($request->filled('name')) {
            $user->name = $request->input('name');
        }
        $user->country_code = $request->input('country_code');
        $user->phone_no = $request->input('phone_no');
        $user->onboarded_at = now();
        $user->save();

        return $this->sendResponse(new UserResource($user), 'Onboarding complete.');
    }
}
```

- [ ] **Step 5: Routes**

In `routes/api.php`: add the public login route near the other public auth routes (after the `AuthController` group, ~line 121):
```php
Route::post('agent/google-login', [\App\Http\Controllers\AgentAuthController::class, 'googleLogin']);
```
And inside the `auth:sanctum` group (after `/user`, ~line 131):
```php
    Route::post('agent/onboarding', [\App\Http\Controllers\AgentAuthController::class, 'onboarding']);
```

- [ ] **Step 6: Manual review (no `php` CLI) + commit**

Confirm: migration additive nullable timestamp; fillable + resource expose `onboarded_at`; config google.client_id; controller verifies `aud` + `email_verified` and 401s otherwise, 422 on non-agent email, creates active agent with null password, issues `AgentSite` token, returns `needs_onboarding`; onboarding guards `type==='agent'` + `agree_terms accepted` + sets `onboarded_at`; routes (public login, auth onboarding). NEVER run migrate.
```bash
git add database/migrations/2026_06_26_000000_add_onboarded_at_to_users_table.php app/Models/User.php app/Http/Resources/UserResource.php config/services.php .env app/Http/Controllers/AgentAuthController.php routes/api.php
git commit -m "feat(agent): Google login (tokeninfo verify) + onboarding endpoints

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (FE): Agent auth area (deps, routing, pages)

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/agent-google-auth` (off `production`). Single task so the new routes + pages land together (build stays green).

**Files:**
- Modify: `package.json`/lock (`@react-oauth/google`); `.env`; `src/main.tsx`; `src/App.tsx`
- Create: `src/services/agentApi.ts`; `src/utils/AgentProtectedRoute.tsx`; `src/pages/AgentPages/AgentLogin.tsx`, `AgentOnboarding.tsx`, `AgentHome.tsx`

**Interfaces:**
- Consumes: Task 1 endpoints.

- [ ] **Step 1: Dep + envs**

Run `npm install @react-oauth/google`. In `.env` add: `VITE_GOOGLE_CLIENT_ID=` (user sets value), `VITE_AGENT_URL=https://agent.renoxpert.my/`, `VITE_STAGING_AGENT_URL=https://s-agent.renoxpert.my/`.

- [ ] **Step 2: GoogleOAuthProvider in `main.tsx`**

Replace `src/main.tsx` render with:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <App />
    </GoogleOAuthProvider>
);
```

- [ ] **Step 3: Agent API service**

Create `src/services/agentApi.ts`:
```ts
import axios from 'axios';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production" ? import.meta.env.VITE_API_URL
    : import.meta.env.VITE_APP_ENV === "staging" ? import.meta.env.VITE_STAGING_API_URL
    : import.meta.env.VITE_APP_ENV === "local" ? import.meta.env.VITE_LOCAL_API_URL
    : null;

export const getAgentAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('a_token')}` });

export interface AgentUser { id: number; name: string; email: string; type: string; referral_code?: string; onboarded_at?: string | null; country_code?: string | null; phone_no?: string | null; }

export const agentGoogleLogin = async (credential: string): Promise<{ token: string; user: AgentUser; needs_onboarding: boolean }> => {
    const response = await axios.post(API_URL + 'agent/google-login', { credential });
    const data = response.data?.data ?? response.data;
    if (data?.token) localStorage.setItem('a_token', data.token);
    return data;
};

export const agentOnboarding = async (payload: { name?: string; country_code: string; phone_no: string; agree_terms: boolean }): Promise<AgentUser> => {
    const response = await axios.post(API_URL + 'agent/onboarding', payload, { headers: getAgentAuthHeaders() });
    return response.data?.data ?? response.data;
};

export const getAgentUser = async (): Promise<AgentUser> => {
    const response = await axios.get(API_URL + 'user', { headers: getAgentAuthHeaders() });
    return response.data?.data ?? response.data;
};

export const agentLogout = () => { localStorage.removeItem('a_token'); };
```

- [ ] **Step 4: `AgentProtectedRoute`**

Create `src/utils/AgentProtectedRoute.tsx` (mirror `OperationProtectedRoute`):
```tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('a_token');
    if (!token) {
        return <Navigate to={LOCAL_PATH_PREFIX + 'login'} />;
    }
    return children;
};

export default AgentProtectedRoute;
```

- [ ] **Step 5: Pages**

Create `src/pages/AgentPages/AgentLogin.tsx`:
```tsx
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
```

Create `src/pages/AgentPages/AgentOnboarding.tsx`:
```tsx
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
```

Create `src/pages/AgentPages/AgentHome.tsx` (placeholder — SP5 fills the body):
```tsx
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
```

- [ ] **Step 6: Wire the agent route group in `App.tsx`**

Import the pages + `AgentProtectedRoute` (near the other imports). Add a new agent group to BOTH `routeCat` (after `routeCat[6]`) and `routeCatLocal` (after `routeCatLocal[6]`, paths prefixed `/agent/` like the other local groups — read how `routeCatLocal` mirrors `routeCat` to match the prefix convention):
```tsx
    // routeCat[7] — Agent (production paths)
    [
        { path: '/login', element: <AgentLogin />, layout: null },
        { path: '/onboarding', element: <AgentProtectedRoute><AgentOnboarding /></AgentProtectedRoute>, layout: null },
        { path: '/', element: <AgentProtectedRoute><AgentHome /></AgentProtectedRoute>, layout: null },
    ],
```
(For `routeCatLocal[7]`, use `/agent/login`, `/agent/onboarding`, `/agent` to match the local-prefix pattern.)
Add the domain flag near the other `is*Domain` consts:
```tsx
    const isAgentDomain = hostname === 'agent.renoxpert.my' || hostname === 's-agent.renoxpert.my' || hostname === 'localhost';
```
In the domain selection chain, add before the fallback:
```tsx
        } else if (isAgentDomain) {
            filteredRoutes = routeCat[7]; // Agent
```
And include the agent group in the localhost spread: `...routeCatLocal[7]`.

- [ ] **Step 7: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/agentApi.ts src/utils/AgentProtectedRoute.tsx src/pages/AgentPages/AgentLogin.tsx src/pages/AgentPages/AgentOnboarding.tsx src/pages/AgentPages/AgentHome.tsx src/main.tsx src/App.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → new files 0; `main.tsx`/`App.tsx` no NEW errors vs their baselines. Fix any new errors (no `any`).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .env src/main.tsx src/App.tsx src/services/agentApi.ts src/utils/AgentProtectedRoute.tsx src/pages/AgentPages
git commit -m "feat(agent): Google login + onboarding + gated agent area (FE)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3: Verify + finalize

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/services/agentApi.ts src/utils/AgentProtectedRoute.tsx src/pages/AgentPages/AgentLogin.tsx src/pages/AgentPages/AgentOnboarding.tsx src/pages/AgentPages/AgentHome.tsx src/main.tsx src/App.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: new files 0; main.tsx/App.tsx at baseline.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: migration additive nullable; resource/fillable; google config; controller token verification (`aud` + `email_verified`, 401s), 422 non-agent email, active agent w/ null password, `AgentSite` token, `needs_onboarding`; onboarding guard + `agree_terms accepted` + `onboarded_at`; routes correct. No `php artisan` run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/agent-google-auth
gh pr create --base production --head feature/agent-google-auth \
  --title "feat(agent): Google login + onboarding (Agent Campaign SP4)" \
  --body "<summary; run php artisan migrate after merge (adds users.onboarded_at); set GOOGLE_CLIENT_ID in .env; 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/agent-google-auth
npm run build   # exit 0 gate
git branch -d feature/agent-google-auth
git push origin production
```

- [ ] **Step 5: Hand off**

Report to the user the infra they must set: create a Google OAuth Web client (authorized JS origins: the agent domain(s) + `http://localhost:5173`), set `VITE_GOOGLE_CLIENT_ID` (FE) + `GOOGLE_CLIENT_ID` (BE), point DNS for `agent.renoxpert.my`; run `php artisan migrate`. Then QA: first Google sign-in → onboarding → home; returning agent skips onboarding; staff/owner email rejected; no `a_token` → redirect to login.

---

## Self-Review

**Spec coverage:** §4 BE (migration + resource + config + AgentAuthController googleLogin/onboarding + routes) → Task 1 ✅; §5 FE (dep + envs + provider + domain/route group + a_token/AgentProtectedRoute + agentApi + login/onboarding/home pages) → Task 2 ✅; §6/§7 constraints + verify → Global Constraints + Task 3 ✅.

**Placeholder scan:** No TBD/TODO. The BE PR body `<...>` is a compose-at-finalize instruction. `GOOGLE_CLIENT_ID=`/`VITE_GOOGLE_CLIENT_ID=` are intentionally empty env keys (user supplies the value) — the code guards `|| ""`/config null so build/app run without it. The `routeCatLocal[7]` guidance is a bounded instruction to mirror the existing prefix pattern.

**Type consistency:** `agentGoogleLogin(credential): {token,user,needs_onboarding}`; `agentOnboarding({name?,country_code,phone_no,agree_terms})` matches the BE validator (`country_code`/`phone_no` required, `agree_terms accepted`); `AgentUser.onboarded_at` matches the resource field; `a_token` storage key consistent across agentApi + AgentProtectedRoute; token name `AgentSite`. Endpoints `POST agent/google-login` (public) + `POST agent/onboarding` (auth) match the routes. ✅
