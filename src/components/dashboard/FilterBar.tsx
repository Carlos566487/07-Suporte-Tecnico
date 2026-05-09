import React from 'react';

export function FilterBar() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md">
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 bg-secondary text-on-secondary font-label-bold text-label-bold rounded-full shadow-sm hover:bg-secondary-container transition-colors">Todos</button>
        <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-bold text-label-bold rounded-full hover:bg-surface-container-low transition-colors">Informática/TI</button>
        <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-bold text-label-bold rounded-full hover:bg-surface-container-low transition-colors">Elétrica</button>
        <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-bold text-label-bold rounded-full hover:bg-surface-container-low transition-colors hidden md:block">Predial/Civil</button>
        <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-bold text-label-bold rounded-full hover:bg-surface-container-low transition-colors hidden lg:block">Segurança Eletrônica</button>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-bold text-label-bold rounded-lg hover:bg-surface-container-low transition-colors shrink-0">
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>filter_list</span>
        Filtros Avançados
      </button>
    </div>
  );
}
