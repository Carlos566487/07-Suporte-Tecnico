import React, { useState, useEffect } from 'react';
import { supabase, SystemConfig, User } from '../../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase.from('system_config').select('*').single();
    if (data) {
      setConfig(data);
      document.title = `${data.title || 'SupportHub'} - Login`;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    setLoading(false);

    if (error || !data) {
      setError('Usuário ou senha incorretos.');
    } else {
      onLogin(data as User);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-8 flex flex-col items-center">
        
        {config?.logo_url ? (
          <img alt="System Logo" className="w-20 h-20 rounded-xl object-contain mb-6 shadow-sm border border-outline-variant/20 bg-white p-1" src={config.logo_url} />
        ) : (
          <div className="w-20 h-20 rounded-xl border border-outline-variant/30 bg-white flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '40px' }}>domain</span>
          </div>
        )}

        <div className="text-center mb-8 w-full">
          <h1 className="font-display-sm text-display-sm font-bold text-on-surface mb-2">
            Bem-vindo ao {config?.title || 'SupportHub'}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {config?.subtitle || 'Operações Técnicas'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user" className="font-label-md text-label-md text-on-surface">Usuário</label>
            <input
              id="user"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface px-4 py-3 rounded-xl border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface"
              placeholder="Digite seu usuário"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pass" className="font-label-md text-label-md text-on-surface">Senha</label>
            <input
              id="pass"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface px-4 py-3 rounded-xl border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface"
              placeholder="Digite sua senha"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error rounded-lg p-3 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-lg text-label-lg py-3.5 rounded-xl hover:bg-primary-hover transition-colors shadow-sm mt-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
