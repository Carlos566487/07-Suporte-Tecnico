import React, { useState, useEffect, useRef } from 'react';
import { supabase, SystemConfig, User } from '../../lib/supabase';

interface HeaderProps {
  onMenuClick: () => void;
  onNavigate: (view: string) => void;
  currentUser: User | null;
  currentView: string;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  onLogout?: () => void;
}

export function Header({ onMenuClick, onNavigate, currentUser, currentView, searchTerm = '', onSearch, onLogout }: HeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchConfig();
    const handleSystemChange = () => fetchConfig();
    window.addEventListener('system-config-changed', handleSystemChange);
    return () => window.removeEventListener('system-config-changed', handleSystemChange);
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase.from('system_config').select('*').single();
    if (data) setSystemConfig(data);
  };

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(localSearch);
  };

  const showSearch = currentView === 'dashboard' || currentView === 'tickets';

  return (
    <header className="sticky top-0 z-30 w-full bg-surface shadow-sm border-b border-outline-variant flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors p-2 -ml-2" onClick={onMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="font-headline-md text-headline-md font-bold text-primary hidden sm:block whitespace-nowrap">Painel Técnico</h2>
        
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-secondary/20 transition-all rounded-lg hidden lg:block ml-4">
            <button type="submit" className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-outline hover:text-secondary transition-colors rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
            </button>
            <input 
              className="w-full pl-11 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
              placeholder="Buscar chamados por título ou usuário..." 
              type="text" 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </form>
        )}

        {/* + Novo Chamado Button to the right of search input */}
        {currentUser?.role !== 'Cliente' && (
          <button 
            className="hidden sm:flex items-center justify-center gap-2 bg-secondary text-on-secondary font-label-bold text-label-bold py-2 px-4 rounded-lg hover:bg-secondary-container transition-colors shadow-sm ml-4 whitespace-nowrap"
            onClick={() => onNavigate('new-ticket')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Novo Chamado
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Mobile New Ticket button */}
        {currentUser?.role !== 'Cliente' && (
          <button 
            className="sm:hidden text-secondary hover:bg-surface-container-low transition-colors p-2 rounded-full"
            onClick={() => onNavigate('new-ticket')}
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        )}
        
        {showSearch && (
          <button className="lg:hidden text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors p-2 rounded-full relative">
            <span className="material-symbols-outlined">search</span>
          </button>
        )}

        <button className="text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors p-2 rounded-full relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <div className="relative" ref={helpRef}>
          <button 
            className="text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors p-2 rounded-full hidden sm:block"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
          >
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          
          {isHelpOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-lg shadow-lg border border-outline-variant py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="font-label-bold text-label-bold text-on-surface mb-2">{systemConfig?.help_text || 'Precisa de Ajuda?'}</h4>
              
              <div className="flex flex-col gap-2">
                {systemConfig?.help_email && (
                  <a href={`mailto:${systemConfig.help_email}`} className="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors font-body-sm text-body-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                    {systemConfig.help_email}
                  </a>
                )}
                
                {systemConfig?.help_phone && (
                  <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                    {systemConfig.help_phone}
                  </div>
                )}
                
                {systemConfig?.help_site && (
                  <a href={systemConfig.help_site.startsWith('http') ? systemConfig.help_site : `https://${systemConfig.help_site}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors font-body-sm text-body-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>language</span>
                    {systemConfig.help_site}
                  </a>
                )}

                {!systemConfig?.help_email && !systemConfig?.help_phone && !systemConfig?.help_site && (
                  <p className="text-on-surface-variant font-body-sm text-body-sm">Nenhuma informação de contato disponível.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative ml-2" ref={dropdownRef}>
          <button 
            className="flex items-center gap-2 hover:bg-surface-container-low p-1.5 rounded-lg transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="hidden sm:block font-label-md text-label-md text-on-surface font-medium">
              {currentUser?.name.split(' ')[0] || 'Usuário'}
            </span>
            {currentUser?.avatar_url ? (
              <img alt="User Profile" className="w-8 h-8 rounded-full object-cover border border-outline-variant" src={currentUser.avatar_url} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-xs">
                {currentUser?.avatar_initials || 'AD'}
              </div>
            )}
            <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '18px' }}>
              expand_more
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-lg shadow-lg border border-outline-variant py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-outline-variant/30 mb-1">
                <p className="font-body-sm text-on-surface font-medium truncate">{currentUser?.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{currentUser?.role}</p>
              </div>
              <button 
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low transition-colors text-left text-on-surface font-body-sm"
                onClick={() => { setIsDropdownOpen(false); onNavigate('settings'); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
                Meu Perfil
              </button>
              <button 
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-error/10 text-error transition-colors text-left font-body-sm mt-1"
                onClick={() => { setIsDropdownOpen(false); if (onLogout) onLogout(); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
