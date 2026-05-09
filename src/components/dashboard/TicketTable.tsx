import React, { useState, useEffect } from 'react';
import { Pagination } from './Pagination';
import { supabase, Ticket, User } from '../../lib/supabase';
import { EditTicketModal } from './EditTicketModal';

interface TicketTableProps {
  currentUser?: User | null;
  searchTerm?: string;
}

export function TicketTable({ currentUser, searchTerm = '' }: TicketTableProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [searchTerm, statusFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [ticketsRes, categoriesRes, statusesRes, usersRes] = await Promise.all([
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, color'),
        supabase.from('statuses').select('id, name, labelType'),
        supabase.from('users').select('id, name')
      ]);

      if (ticketsRes.error) throw new Error('Erro ao buscar chamados: ' + ticketsRes.error.message);
      if (categoriesRes.error) console.error('Categorias:', categoriesRes.error);
      if (statusesRes.error) console.error('Status:', statusesRes.error);

      const catMap: Record<string, any> = {};
      if (categoriesRes.data) {
        categoriesRes.data.forEach(c => { catMap[c.id] = c; });
      }

      const statMap: Record<string, any> = {};
      if (statusesRes.data) {
        statusesRes.data.forEach(s => { statMap[s.id] = s; });
        setStatuses(statusesRes.data);
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

        if (statusFilter !== 'all') {
          enriched = enriched.filter(t => t.status_id === statusFilter);
        }

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          enriched = enriched.filter(t => 
            (t.title && t.title.toLowerCase().includes(lowerSearch)) || 
            (t.ticket_number && t.ticket_number.toLowerCase().includes(lowerSearch)) ||
            (t.author?.name && t.author.name.toLowerCase().includes(lowerSearch))
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
      case 'error': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }} title="Urgente">error</span>;
      case 'high': return <span className="material-symbols-outlined text-[#F97316]" style={{ fontVariationSettings: "'FILL' 1" }} title="Alta">warning</span>;
      case 'normal': return <span className="material-symbols-outlined text-[#EAB308]" style={{ fontVariationSettings: "'FILL' 1" }} title="Normal">info</span>;
      case 'low': return <span className="material-symbols-outlined text-outline" title="Baixa">arrow_downward</span>;
      default: return null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este chamado? Esta ação é irreversível.')) {
      return;
    }
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (!error) {
      setTickets(tickets.filter(t => t.id !== id));
      window.dispatchEvent(new Event('dashboard-stats-changed'));
    } else {
      alert('Erro ao excluir chamado: ' + error.message);
    }
  };

  return (
    <>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-title-sm text-title-sm text-on-surface">Chamados Recentes</h3>
          <div className="flex gap-2 items-center">
            <span className="material-symbols-outlined text-outline-variant text-sm">filter_list</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-sm text-body-sm text-on-surface"
            >
              <option value="all">Todos os Status</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          {error && (
            <div className="p-12 text-center text-error bg-error/5 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl mb-2">report</span>
              <p className="font-title-md text-title-md font-bold mb-1">Ops! Algo deu errado.</p>
              <p className="font-body-md text-body-md opacity-80">{error}</p>
              <button 
                onClick={() => fetchTickets()}
                className="mt-4 px-4 py-2 bg-error text-white rounded-lg font-label-bold text-label-bold hover:bg-error/90 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
          {isLoading ? (
             <div className="flex items-center justify-center h-[300px]">
                <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">
                  <th className="px-6 py-3 font-medium">ID/Ticket</th>
                  <th className="px-6 py-3 font-medium">Assunto</th>
                  <th className="px-6 py-3 font-medium">Categoria</th>
                  <th className="px-6 py-3 font-medium text-center">Prioridade</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant/50">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">Nenhum chamado encontrado.</td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-label-bold text-label-bold text-secondary">{ticket.ticket_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-on-surface-variant text-xs mt-0.5">
                          {ticket.closed_at 
                            ? `Fechado em ${new Date(ticket.closed_at).toLocaleDateString('pt-BR')} às ${new Date(ticket.closed_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                            : `Criado em ${new Date(ticket.created_at).toLocaleDateString('pt-BR')} às ${new Date(ticket.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.category && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${ticket.category.color?.replace('bg-', 'text-')} bg-opacity-10 border border-transparent`} style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            {ticket.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPriorityIcon(ticket.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.status && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status.labelType)}`}>
                            {ticket.status.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="inline-flex items-center gap-1 text-secondary hover:text-secondary/70 font-label-bold text-label-bold transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          Editar
                        </button>
                        {currentUser?.role === 'Administrador' && (
                          <button
                            onClick={() => handleDelete(ticket.id)}
                            className="inline-flex items-center gap-1 text-error hover:text-error/70 font-label-bold text-label-bold transition-colors"
                            title="Excluir Chamado"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <Pagination />
      </div>

      {/* Edit Modal */}
      {selectedTicket && (
        <EditTicketModal
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={() => setSelectedTicket(null)}
          onSaved={fetchTickets}
        />
      )}
    </>
  );
}


