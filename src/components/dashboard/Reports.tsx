import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface MetricGroup {
  label: string;
  count: number;
  color?: string;
}

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    closed: 0,
    pending: 0,
    byCategory: [] as MetricGroup[],
    byPriority: [] as MetricGroup[],
    byStatus: [] as MetricGroup[],
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, categoriesRes, statusesRes] = await Promise.all([
        supabase.from('tickets').select('id, category_id, priority, status_id, created_at, closed_at'),
        supabase.from('categories').select('id, name, color'),
        supabase.from('statuses').select('id, name')
      ]);

      if (ticketsRes.data && categoriesRes.data && statusesRes.data) {
        const tickets = ticketsRes.data;
        const categories = categoriesRes.data;
        const statuses = statusesRes.data;

        // General Stats
        const total = tickets.length;
        const closed = tickets.filter(t => t.closed_at).length;
        const pending = total - closed;

        // Group by Category
        const catMap: Record<string, number> = {};
        tickets.forEach(t => {
          if (t.category_id) catMap[t.category_id] = (catMap[t.category_id] || 0) + 1;
        });
        const byCategory = categories.map(c => ({
          label: c.name,
          count: catMap[c.id] || 0,
          color: c.color?.replace('bg-', '') || 'primary'
        })).sort((a, b) => b.count - a.count);

        // Group by Priority
        const prioMap: Record<string, number> = { low: 0, normal: 0, high: 0, urgent: 0 };
        tickets.forEach(t => {
          if (t.priority) prioMap[t.priority] = (prioMap[t.priority] || 0) + 1;
        });
        const byPriority = [
          { label: 'Baixa', count: prioMap.low, color: 'outline' },
          { label: 'Normal', count: prioMap.normal, color: 'info' },
          { label: 'Alta', count: prioMap.high, color: 'warning' },
          { label: 'Urgente', count: prioMap.urgent, color: 'error' },
        ];

        // Group by Status
        const statCounts: Record<string, number> = {};
        tickets.forEach(t => {
          if (t.status_id) statCounts[t.status_id] = (statCounts[t.status_id] || 0) + 1;
        });
        const byStatus = statuses.map(s => ({
          label: s.name,
          count: statCounts[s.id] || 0
        })).sort((a, b) => b.count - a.count);

        setStats({ total, closed, pending, byCategory, byPriority, byStatus });
      }
    } catch (err) {
      console.error('Erro ao gerar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Relatórios e Métricas</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Visão consolidada do desempenho da central de suporte.</p>
          </div>
          <button 
            onClick={fetchReportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant text-on-surface font-label-bold text-label-bold rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
            Atualizar Dados
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total de Chamados</p>
          <p className="font-display-md text-display-md font-bold text-on-surface">{stats.total.toString().padStart(2, '0')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm border-l-4 border-l-[#10B981]">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Resolvidos / Fechados</p>
          <p className="font-display-md text-display-md font-bold text-[#10B981]">{stats.closed.toString().padStart(2, '0')}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm border-l-4 border-l-secondary">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Pendentes</p>
          <p className="font-display-md text-display-md font-bold text-secondary">{stats.pending.toString().padStart(2, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart Mock/List */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">category</span>
            <h3 className="font-title-sm text-title-sm text-on-surface">Chamados por Categoria</h3>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {stats.byCategory.map((cat, i) => {
              const percentage = stats.total > 0 ? (cat.count / stats.total) * 100 : 0;
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">{cat.label}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{cat.count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: i === 0 ? '#3B82F6' : i === 1 ? '#10B981' : i === 2 ? '#F59E0B' : '#6B7280'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority and Status distribution */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden flex-1">
            <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-bright flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">priority_high</span>
              <h3 className="font-title-sm text-title-sm text-on-surface">Distribuição de Prioridade</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {stats.byPriority.map((prio, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/10">
                  <div className={`w-3 h-3 rounded-full ${prio.color === 'error' ? 'bg-error' : prio.color === 'warning' ? 'bg-warning' : prio.color === 'info' ? 'bg-info' : 'bg-outline-variant'}`} />
                  <div className="flex-1">
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-none mb-1">{prio.label}</p>
                    <p className="font-title-md text-title-md font-bold text-on-surface">{prio.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden flex-1">
            <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-bright flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">assignment_turned_in</span>
              <h3 className="font-title-sm text-title-sm text-on-surface">Resumo por Status</h3>
            </div>
            <div className="p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-label-sm text-outline-variant uppercase border-b border-outline-variant/10">
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium text-right">Qtd.</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant/10">
                  {stats.byStatus.map((stat, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/30">
                      <td className="px-4 py-2.5 text-on-surface">{stat.label}</td>
                      <td className="px-4 py-2.5 text-on-surface font-bold text-right">{stat.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
