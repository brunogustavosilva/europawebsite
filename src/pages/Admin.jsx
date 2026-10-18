import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { AdminDashboard } from '../components/admin/AdminDashboard.jsx';
import logo from '../assets/logo-euro-l.svg';

export function Admin() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [busy, setBusy] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        async function restoreSession() {
            try {
                const response = await fetch('/api/admin/session', { signal: controller.signal });
                if (response.ok) setUser((await response.json()).user);
                else if (response.status !== 401) setError('Não foi possível verificar seu acesso. Tente novamente.');
            } catch (error) {
                if (error.name !== 'AbortError') setError('Não foi possível conectar. Tente novamente.');
            } finally {
                if (!controller.signal.aborted) setChecking(false);
            }
        }
        restoreSession();
        return () => controller.abort();
    }, []);

    async function login(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
            setUser(data.user);
            setPassword('');
        } catch (error) {
            setError(error.message === 'Failed to fetch' ? 'Não foi possível conectar. Tente novamente.' : error.message);
        } finally { setBusy(false); }
    }

    async function logout() {
        setBusy(true);
        setError('');
        try {
            const response = await fetch('/api/admin/logout', { method: 'POST' });
            if (!response.ok) throw new Error();
            setUser(null);
            setPassword('');
        } catch { setError('Não foi possível sair. Tente novamente.'); }
        finally { setBusy(false); }
    }

    const expireSession = useCallback(() => { setUser(null); setError('Sua sessão expirou. Entre novamente.'); }, []);

    if (user) return <AdminDashboard user={user} onLogout={logout} loggingOut={busy} logoutError={error} onExpired={expireSession} />;

    return (
        <main id="main-content" className="admin-main">
            <div className="admin-panel">
                <img className="admin-logo" src={logo} alt="Euro Light" width="88" height="88" />
                <h1>{user ? 'Área administrativa' : 'Area Restrita'}</h1>
                {checking ? <p role="status">Verificando acesso…</p> : (
                    <form className="admin-form" onSubmit={login}>
                        <label className="form-field">
                            Usuário
                            <input autoComplete="username" name="username" required maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} />
                        </label>
                        <label className="form-field">
                            Senha
                            <input type="password" autoComplete="current-password" name="password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
                        </label>
                        <Button type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
                    </form>
                )}
                {error && <p className="danger" role="alert">{error}</p>}
            </div>
        </main>
    );
}
