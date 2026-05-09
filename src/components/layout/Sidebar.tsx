import React, { useState, useEffect } from 'react';
import { supabase, SystemConfig, User } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
}

export function Sidebar({ isOpen, setIsOpen, currentView = 'dashboard', onNavigate, currentUser, onLogout }: SidebarProps) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  useEffect(() => {
    fetchData();

    const handleSystemChange = () => fetchData();

    window.addEventListener('system-config-changed', handleSystemChange);

    return () => {
      window.removeEventListener('system-config-changed', handleSystemChange);
    };
  }, [currentView]); // Re-fetch when navigating to ensure freshness

  const fetchData = async () => {
    const { data } = await supabase.from('system_config').select('*').single();

    if (data) {
      setConfig(data);
      document.title = data.title || 'SupportHub';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <nav className={`fixed left-0 top-0 h-full w-64 flex flex-col bg-inverse-surface shadow-md z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-6 flex flex-col gap-4 border-b border-outline-variant/20 relative">
          {/* Close button for mobile - absolutely positioned so it doesn't break the vertical flow */}
          <button className="md:hidden text-outline-variant hover:text-white absolute top-6 right-6" onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="flex flex-col items-start gap-4">
            {config?.logo_url ? (
              <img alt="System Logo" className="w-14 h-14 rounded-md object-contain border border-outline-variant/30 bg-white p-0.5 shadow-sm" src={config.logo_url} />
            ) : (
              <div className="w-14 h-14 rounded-md border border-outline-variant/30 bg-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '28px' }}>domain</span>
              </div>
            )}
            <div className="w-full">
              <h1 className="font-title-md text-title-md font-bold text-white truncate">{config?.title || 'SupportHub'}</h1>
              <p className="font-label-sm text-label-sm text-outline-variant truncate">{config?.subtitle || 'Operações Técnicas'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 py-6 flex-1 overflow-y-auto">
          {/* Nav Links */}
          {currentUser.role !== 'Cliente' && (
            <a 
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 font-body-md text-body-md ${currentView === 'dashboard' ? 'bg-white/10 text-white border-l-4 border-secondary scale-[0.99]' : 'text-outline-variant hover:text-white hover:bg-white/5'}`} 
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate?.('dashboard'); setIsOpen(false); }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
              Painel Geral
            </a>
          )}
          <a 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 font-body-md text-body-md ${currentView === 'tickets' ? 'bg-white/10 text-white border-l-4 border-secondary scale-[0.99]' : 'text-outline-variant hover:text-white hover:bg-white/5'}`} 
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('tickets'); setIsOpen(false); }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'tickets' ? "'FILL' 1" : "'FILL' 0" }}>confirmation_number</span>
            Meus Chamados
          </a>
          {currentUser.role !== 'Cliente' && (
            <a 
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 font-body-md text-body-md ${currentView === 'reports' ? 'bg-white/10 text-white border-l-4 border-secondary scale-[0.99]' : 'text-outline-variant hover:text-white hover:bg-white/5'}`} 
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate?.('reports'); setIsOpen(false); }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'reports' ? "'FILL' 1" : "'FILL' 0" }}>analytics</span>
              Relatórios
            </a>
          )}

          <a 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 font-body-md text-body-md ${currentView === 'settings' ? 'bg-white/10 text-white border-l-4 border-secondary scale-[0.99]' : 'text-outline-variant hover:text-white hover:bg-white/5'}`} 
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('settings'); setIsOpen(false); }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
            Configurações
          </a>
        </div>
        
        <div className="p-6 mt-auto flex flex-col gap-6 border-t border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-secondary flex items-center justify-center">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-label-md text-label-md text-on-secondary font-bold">
                  {currentUser.avatar_initials || 'AD'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-sm text-label-sm text-outline-variant truncate">{currentUser.role || 'Cargo do Usuário'}</p>
              <p className="font-body-sm text-body-sm text-white font-medium truncate">{currentUser.name || 'Nome do Usuário'}</p>
            </div>
          </div>
          
          <button 
            className="w-full flex items-center justify-center gap-2 bg-error/10 text-error font-label-bold text-label-bold py-2.5 rounded-lg hover:bg-error/20 transition-colors shadow-sm border border-error/20"
            onClick={onLogout}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
            Sair do Sistema
          </button>
        </div>
      </nav>
    </>
  );
}
