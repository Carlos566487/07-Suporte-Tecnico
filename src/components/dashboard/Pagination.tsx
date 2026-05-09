import React from 'react';

export function Pagination() {
  return (
    <div className="px-6 py-3 border-t border-outline-variant bg-surface flex items-center justify-between">
      <div className="font-body-sm text-body-sm text-on-surface-variant hidden sm:block">
        Mostrando <span className="font-medium">1</span> a <span className="font-medium">4</span> de <span className="font-medium">42</span> resultados
      </div>
      <div className="flex gap-1 w-full sm:w-auto justify-between sm:justify-end">
        <button className="px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant disabled:opacity-50 hover:bg-surface-container-low" disabled>Anterior</button>
        <div className="flex gap-1">
          <button className="px-3 py-1 bg-secondary text-on-secondary rounded-md">1</button>
          <button className="px-3 py-1 border border-outline-variant rounded-md text-on-surface hover:bg-surface-container-low">2</button>
          <button className="px-3 py-1 border border-outline-variant rounded-md text-on-surface hover:bg-surface-container-low">3</button>
        </div>
        <button className="px-3 py-1 border border-outline-variant rounded-md text-on-surface hover:bg-surface-container-low">Próxima</button>
      </div>
    </div>
  );
}
