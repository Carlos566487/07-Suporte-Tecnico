import React, { useState, useEffect } from 'react';
import { supabase, Ticket, Status, User } from '../../lib/supabase';

interface EditTicketModalProps {
  ticket: Ticket;
  currentUser?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export function EditTicketModal({ ticket, currentUser, onClose, onSaved }: EditTicketModalProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [supportUsers, setSupportUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    status_id: ticket.status_id,
    priority: ticket.priority,
    assigned_to: ticket.assigned_to || '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('statuses').select('*').order('name').then(({ data }) => {
      if (data) setStatuses(data);
    });

    supabase.from('users').select('*').in('role', ['Técnico', 'Administrador']).order('name').then(({ data }) => {
      if (data) setSupportUsers(data);
    });

    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status_id: formData.status_id,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
      })
      .eq('id', ticket.id);

    setIsSaving(false);

    if (updateError) {
      setError('Erro ao salvar: ' + updateError.message);
    } else {
      onSaved();
      onClose();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low">
          <div>
            <p className="font-label-sm text-label-sm text-secondary">{ticket.ticket_number}</p>
            <h2 className="font-title-md text-title-md text-on-surface mt-0.5 line-clamp-1">{ticket.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Read-only Info */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 bg-surface border-b border-outline-variant/20">
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Categoria</span>
            <span className="font-body-md text-body-md text-on-surface">{ticket.category?.name ?? '—'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Equipamento</span>
            <span className="font-body-md text-body-md text-on-surface">{ticket.equipment_id || '—'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">📅 Abertura</span>
            <span className="font-body-sm text-body-sm text-on-surface">{formatDate(ticket.created_at)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">✅ Fechamento</span>
            <span className={`font-body-sm text-body-sm ${ticket.closed_at ? 'text-[#10B981]' : 'text-outline'}`}>
              {ticket.closed_at ? formatDate(ticket.closed_at) : 'Em aberto'}
            </span>
          </div>
          {ticket.description && (
            <div className="col-span-2 flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Descrição</span>
              <p className="font-body-sm text-body-sm text-on-surface line-clamp-3">{ticket.description}</p>
            </div>
          )}
        </div>

        {/* Editable Fields */}
        <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
          <p className="font-title-sm text-title-sm text-on-surface">Ações do Administrador</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-status" className="font-label-sm text-label-sm text-on-surface">
                Status <span className="text-secondary">*</span>
              </label>
              <select
                id="edit-status"
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-sm text-body-sm text-on-surface appearance-none"
                required
                disabled={isSaving}
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-priority" className="font-label-sm text-label-sm text-on-surface">
                Prioridade <span className="text-secondary">*</span>
              </label>
              <select
                id="edit-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-sm text-body-sm text-on-surface appearance-none disabled:opacity-60 disabled:bg-surface-variant cursor-pointer disabled:cursor-not-allowed"
                disabled={isSaving || currentUser?.role === 'Técnico'}
              >
                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-assigned" className="font-label-sm text-label-sm text-on-surface">
              Atribuído a
            </label>
            <select
              id="edit-assigned"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-sm text-body-sm text-on-surface appearance-none cursor-pointer"
              disabled={isSaving}
            >
              <option value="">Não atribuído</option>
              {supportUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-notes" className="font-label-sm text-label-sm text-on-surface">
              Observações / Ação tomada <span className="text-outline">(opcional)</span>
            </label>
            <textarea
              id="edit-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Ex: Peça solicitada ao fornecedor, prazo estimado 3 dias..."
              className="w-full bg-surface px-3 py-2.5 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-sm text-body-sm text-on-surface placeholder:text-outline resize-none"
              disabled={isSaving}
            />
          </div>

          {error && (
            <p className="text-error font-body-sm text-body-sm bg-error/10 px-3 py-2 rounded-lg border border-error/20">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface font-label-bold text-label-bold hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-bold text-label-bold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              )}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
