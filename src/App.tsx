import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatCard } from './components/dashboard/StatCard';
import { FilterBar } from './components/dashboard/FilterBar';
import { TicketTable } from './components/dashboard/TicketTable';
import { NewTicket } from './components/dashboard/NewTicket';
import { MyTickets } from './components/dashboard/MyTickets';
import { Reports } from './components/dashboard/Reports';
import { Settings } from './components/dashboard/Settings';
import { supabase, User } from './lib/supabase';
import { Login } from './components/auth/Login';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ abertos: 0, progresso: 0, pecas: 0, concluidos: 0 });

  React.useEffect(() => {
    if (currentView === 'dashboard') {
      fetchStats();
    }
  }, [currentView]);

  const fetchStats = async () => {
    // This is a simple aggregation, ideally done via RPC or view in Supabase, but doing it clientside for the prototype
    const [ticketsRes, statusesRes] = await Promise.all([
      supabase.from('tickets').select('status_id'),
      supabase.from('statuses').select('id, name')
    ]);
    
    if (ticketsRes.data && statusesRes.data) {
      const statMap: Record<string, string> = {};
      statusesRes.data.forEach(s => { statMap[s.id] = s.name; });

      const counts = { abertos: 0, progresso: 0, pecas: 0, concluidos: 0 };
      ticketsRes.data.forEach(t => {
        const statusName = statMap[t.status_id];
        if (statusName === 'Aberto') counts.abertos++;
        else if (statusName === 'Em Progresso' || statusName === 'Em Atendimento') counts.progresso++;
        else if (statusName === 'Aguardando Peças') counts.pecas++;
        else if (statusName === 'Concluído') counts.concluidos++;
      });
      setStats(counts);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setSearchTerm('');
    if (user.role === 'Cliente') {
      setCurrentView('tickets');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    setSearchTerm('');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Role-based view protection
  if (currentUser.role === 'Cliente' && ['dashboard', 'reports'].includes(currentView)) {
    setCurrentView('tickets');
  }

  return (
    <>
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          onNavigate={setCurrentView} 
          currentUser={currentUser} 
          currentView={currentView}
          searchTerm={searchTerm}
          onSearch={handleSearch}
          onLogout={handleLogout}
        />
        
        {/* Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-container-margin overflow-x-hidden">
          {currentView === 'dashboard' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-lg">
                <StatCard 
                  title="Chamados Abertos" 
                  icon="assignment" 
                  iconColorClass="text-secondary" 
                  iconBgClass="bg-secondary/10" 
                  value={stats.abertos.toString().padStart(2, '0')}
                />
                <StatCard 
                  title="Em Atendimento" 
                  icon="engineering" 
                  iconColorClass="text-[#F59E0B]" 
                  iconBgClass="bg-[#F59E0B]/10" 
                  value={stats.progresso.toString().padStart(2, '0')}
                />
                <StatCard 
                  title="Aguardando Peças" 
                  icon="inventory_2" 
                  iconColorClass="text-[#EF4444]" 
                  iconBgClass="bg-[#EF4444]/10" 
                  value={stats.pecas.toString().padStart(2, '0')}
                />
                <StatCard 
                  title="Concluídos Hoje" 
                  icon="check_circle" 
                  iconColorClass="text-[#10B981]" 
                  iconBgClass="bg-[#10B981]/10" 
                  value={stats.concluidos.toString().padStart(2, '0')}
                />
              </div>
              
              <FilterBar />
              <TicketTable currentUser={currentUser} searchTerm={searchTerm} />
            </>
          )}

          {currentView === 'new-ticket' && <NewTicket key={currentView} currentUser={currentUser} />}
          {currentView === 'tickets' && <MyTickets key={currentView} currentUser={currentUser} searchTerm={searchTerm} />}
          {currentView === 'reports' && currentUser.role !== 'Cliente' && <Reports key={currentView} />}
          {currentView === 'settings' && <Settings key={currentView} currentUser={currentUser} />}

          {/* Fallback for unknown views */}
          {['dashboard', 'new-ticket', 'tickets', 'reports', 'settings'].indexOf(currentView) === -1 && (
             <div className="flex items-center justify-center h-full py-12">
               <p className="text-outline-variant font-body-md text-body-md">Página em construção</p>
             </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
