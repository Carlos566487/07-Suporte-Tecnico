import React, { useState, useEffect } from 'react';
import { supabase, Ticket, User } from '../../lib/supabase';

interface MyTicketsProps {
  currentUser: User;
  searchTerm?: string;
}

export function MyTickets({ currentUser, searchTerm = '' }: MyTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [ticketsRes, categoriesRes, statusesRes, usersRes] = await Promise.all([
        supabase.from('tickets')
          .select('*')
          .eq('author_id', currentUser.id)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, color'),
        supabase.from('statuses').select('id, name, labelType'),
        supabase.from('users').select('id, name')
      ]);

      if (ticketsRes.error) throw new Error(ticketsRes.error.message);

      const catMap: Record<string, any> = {};
      if (categoriesRes.data) {
        categoriesRes.data.forEach(c => { catMap[c.id] = c; });
      }
      
      const statMap: Record<string, any> = {};
      if (statusesRes.data) {
        statusesRes.data.forEach(s => { statMap[s.id] = s; });
      }

      const userMap: Record<string, any> = {};
      if (usersRes.data) {
        usersRes.data.forEach(u => { userMap[u.id] = u; });
      }

      if (ticketsRes.data) {
        let enriched = ticketsRes.data.map(t => ({
          ...t,
          category: catMap[t.category_id] || null,
          status: statMap[t.status_id] || null,
          author: t.author_id ? userMap[t.author_id] : null,
        }));

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          enriched = enriched.filter(t => 
            (t.title && t.title.toLowerCase().includes(lowerSearch)) || 
            (t.ticket_number && t.ticket_number.toLowerCase().includes(lowerSearch))
          );
        }

        setTickets(enriched as any[]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (labelType: string) => {
    switch (labelType) {
      case 'success': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
      case 'warning': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      case 'info': return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

      {/* User Info Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary/30 shadow-md flex-shrink-0">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="font-headline-sm text-headline-sm text-on-secondary font-bold">
                {currentUser?.avatar_initials ?? 'AD'}
              </span>
            </div>
          )}
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {currentUser?.name ?? 'Usuário'}
          </h2>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">{currentUser?.role}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{currentUser?.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Total de chamados</p>
          <p className="font-headline-sm text-headline-sm text-on-surface font-bold">{tickets.length.toString().padStart(2, '0')}</p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-title-sm text-title-sm text-on-surface">Chamados Abertos por mim</h3>
        </div>

        {tickets.length === 0 ? (
          <div className="flex items-center justify-center py-12 m-4 bg-surface rounded-lg border border-outline-variant/30 border-dashed">
            <p className="text-outline-variant font-body-md text-body-md">Nenhum chamado encontrado no momento.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="px-6 py-4 hover:bg-surface-container-low/50 transition-colors flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-bold text-label-bold text-secondary">{ticket.ticket_number}</span>
                    {ticket.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/30">
                        {ticket.category.name}
                      </span>
                    )}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface truncate">{ticket.title}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {ticket.closed_at
                      ? `Fechado em ${new Date(ticket.closed_at).toLocaleDateString('pt-BR')}`
                      : `Aberto em ${new Date(ticket.created_at).toLocaleDateString('pt-BR')} às ${new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {ticket.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status.labelType)}`}>
                      {ticket.status.name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

