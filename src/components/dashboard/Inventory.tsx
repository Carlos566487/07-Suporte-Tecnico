import React from 'react';

export function Inventory() {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6 md:p-8 w-full">
      <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Inventário</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">Gerencie os equipamentos, licenças e ativos da empresa.</p>
      
      <div className="flex items-center justify-center py-12 bg-surface rounded-lg border border-outline-variant/30 border-dashed">
        <p className="text-outline-variant font-body-md text-body-md">Módulo de inventário em desenvolvimento.</p>
      </div>
    </div>
  );
}
