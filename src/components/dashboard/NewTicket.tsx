import React, { useState, useEffect } from 'react';
import { supabase, Category, Status, User } from '../../lib/supabase';

interface NewTicketProps {
  currentUser?: User | null;
}

export function NewTicket({ currentUser }: NewTicketProps) {
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    priority: 'normal',
    status_id: '',
    description: '',
    equipmentId: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data: catData } = await supabase.from('categories').select('*').order('name');
      const { data: statData } = await supabase.from('statuses').select('*').order('name');
      
      if (catData) setCategories(catData);
      if (statData) setStatuses(statData);

      // Set default status to 'Aberto' if exists
      const defaultStatus = statData?.find(s => s.name === 'Aberto');
      if (defaultStatus) {
        setFormData(prev => ({ ...prev, status_id: defaultStatus.id }));
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const ticket_number = `#TK-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase.from('tickets').insert([{
      ticket_number,
      title: formData.title,
      category_id: formData.category_id,
      priority: formData.priority,
      status_id: formData.status_id,
      description: formData.description,
      equipment_id: formData.equipmentId,
      author_id: currentUser?.id
    }]);

    setIsLoading(false);

    if (error) {
      alert('Erro ao criar chamado: ' + error.message);
    } else {
      alert('Chamado ' + ticket_number + ' criado com sucesso!');
      setFormData({
        title: '',
        category_id: '',
        priority: 'normal',
        status_id: statuses.find(s => s.name === 'Aberto')?.id || '',
        description: '',
        equipmentId: ''
      });
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6 md:p-8 w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Novo Chamado</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Preencha as informações abaixo para abrir um novo chamado de suporte técnico.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="font-label-sm text-label-sm text-on-surface">Título do Problema</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Computador não liga"
            className="w-full bg-surface px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface placeholder:text-outline"
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category_id" className="font-label-sm text-label-sm text-on-surface">Categoria</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full bg-surface px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none"
              required
              disabled={isLoading}
            >
              <option value="" disabled>Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="priority" className="font-label-sm text-label-sm text-on-surface">Prioridade</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full bg-surface px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none"
              disabled={isLoading}
            >
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="equipmentId" className="font-label-sm text-label-sm text-on-surface">Patrimônio / ID do Equipamento (Opcional)</label>
          <input
            type="text"
            id="equipmentId"
            name="equipmentId"
            value={formData.equipmentId}
            onChange={handleChange}
            placeholder="Ex: PC-12345"
            className="w-full bg-surface px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface placeholder:text-outline"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="font-label-sm text-label-sm text-on-surface">Descrição Detalhada</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descreva o problema com o máximo de detalhes possível..."
            rows={5}
            className="w-full bg-surface px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors font-body-md text-body-md text-on-surface placeholder:text-outline resize-y"
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface font-label-bold text-label-bold hover:bg-surface-variant transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-bold text-label-bold hover:bg-secondary-container transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
            )}
            Enviar Chamado
          </button>
        </div>
      </form>
    </div>
  );
}
