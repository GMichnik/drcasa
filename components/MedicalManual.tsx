import React from 'react';
import { MedicalCondition, DiagnosticFilters } from '../types';
import { MEDICAL_MANUAL_ENTRIES, PATHOGEN_LIST } from '../constants';

interface MedicalManualProps {
  onClose: () => void;
  onDiagnose: (condition: MedicalCondition) => void;
  filters: DiagnosticFilters;
  onFilterChange: (filters: DiagnosticFilters) => void;
}

export const MedicalManual: React.FC<MedicalManualProps> = ({ onClose, onDiagnose, filters, onFilterChange }) => {
  
  const toggleFilter = (key: keyof DiagnosticFilters, value: boolean) => {
    onFilterChange({
      ...filters,
      [key]: filters[key] === value ? null : value
    });
  };

  const handlePathogenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, pathogen: e.target.value });
  };

  const filteredConditions = MEDICAL_MANUAL_ENTRIES.filter(c => {
    if (filters.hasFever !== null && c.keyCriteria.hasFever !== filters.hasFever) return false;
    if (filters.hasBleeding !== null && c.keyCriteria.hasBleeding !== filters.hasBleeding) return false;
    if (filters.isHcgPositive !== null && c.keyCriteria.isHcgPositive !== filters.isHcgPositive) return false;
    
    // Pathogen Logic (Molécule identifiée):
    if (filters.pathogen) {
       if (c.keyCriteria.pathogen !== filters.pathogen) return false;
    }
    
    return true;
  });

  const resetFilters = () => {
    onFilterChange({ 
        hasFever: null, 
        hasBleeding: null, 
        isHcgPositive: null,
        pathogen: ''
    });
  };

  // Helper for filter buttons
  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all border ${
        active 
          ? 'bg-teal-700 border-teal-600 text-white shadow-inner' 
          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-neutral-900 text-neutral-200 w-full max-w-6xl h-[90vh] flex border border-neutral-700 overflow-hidden shadow-2xl">
        {/* Left Panel: Filters */}
        <div className="w-1/3 min-w-[320px] bg-neutral-950 p-6 border-r border-neutral-800 flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold text-amber-600 mb-2 flex items-center gap-2 uppercase tracking-wide">
            <span className="text-2xl">⚕️</span> Diagnóstico Diferencial
          </h2>
          
          <p className="text-xs text-neutral-500 mb-6 font-mono leading-relaxed border-b border-neutral-800 pb-4">
            Marque los signos clínicos observados para identificar la patología.
          </p>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            
            {/* 1. Fiebre */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">1. Fiebre / Infección</h3>
              <div className="flex gap-1">
                <FilterButton label="Sí (>38°C)" active={filters.hasFever === true} onClick={() => toggleFilter('hasFever', true)} />
                <FilterButton label="No (Apirético)" active={filters.hasFever === false} onClick={() => toggleFilter('hasFever', false)} />
              </div>
            </div>

            {/* 2. Sangrados */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">2. Sangrados Vaginales</h3>
              <div className="flex gap-1">
                <FilterButton label="Presentes" active={filters.hasBleeding === true} onClick={() => toggleFilter('hasBleeding', true)} />
                <FilterButton label="Ausentes" active={filters.hasBleeding === false} onClick={() => toggleFilter('hasBleeding', false)} />
              </div>
            </div>

            {/* 3. Beta-HCG */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">3. Test de Embarazo (HCG)</h3>
              <div className="flex gap-1">
                <FilterButton label="Positivo (+)" active={filters.isHcgPositive === true} onClick={() => toggleFilter('isHcgPositive', true)} />
                <FilterButton label="Negativo (-)" active={filters.isHcgPositive === false} onClick={() => toggleFilter('isHcgPositive', false)} />
              </div>
            </div>

            {/* 4. MOLÉCULA */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">4. Identificación Tóxica (Libmol)</h3>
              <select 
                value={filters.pathogen} 
                onChange={handlePathogenChange}
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs p-3 rounded focus:border-amber-600 focus:outline-none"
              >
                <option value="">(Ninguna molécula identificada)</option>
                {PATHOGEN_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-neutral-800">
             <button 
              onClick={resetFilters}
              className="w-full py-2 text-xs text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Reiniciar los filtros
            </button>
            <button 
              onClick={onClose} 
              className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-widest border border-neutral-700 transition-colors"
            >
              Cerrar el Manual
            </button>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="flex-1 bg-neutral-900 p-8 overflow-y-auto relative">
          <h3 className="text-sm font-bold text-neutral-500 mb-6 sticky top-0 bg-neutral-900 py-4 border-b border-neutral-800 z-10 flex justify-between uppercase tracking-widest">
            <span>Pistas Diagnósticas</span>
            <span className={`px-2 py-1 rounded-full text-xs text-black font-bold ${filteredConditions.length <= 2 ? 'bg-amber-500' : 'bg-neutral-600'}`}>
              {filteredConditions.length}
            </span>
          </h3>
          
          <div className="grid gap-6 pb-12">
            {filteredConditions.map(condition => (
              <div key={condition.id} className="bg-neutral-900 border border-neutral-700 p-6 hover:border-teal-600 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-6xl font-bold text-white">{condition.id.slice(0,1).toUpperCase()}</span>
                </div>
                
                <div className="flex flex-col mb-4 relative z-10">
                  <h4 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors mb-1">{condition.name}</h4>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">{condition.id}</span>
                </div>
                
                <p className="text-neutral-400 text-sm mb-6 leading-relaxed font-serif relative z-10">{condition.description}</p>
                
                <div className="mb-6 bg-black/30 p-4 border-l border-neutral-700 relative z-10">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Cuadro Clínico:</p>
                  <ul className="text-sm text-neutral-300 list-none space-y-1 font-mono">
                      {condition.symptoms.map((s, i) => <li key={i}>• {s}</li>)}
                      {condition.keyCriteria.pathogen && (
                        <li className="text-amber-500 font-bold">• Molécula Criminal: {condition.keyCriteria.pathogen}</li>
                      )}
                  </ul>
                </div>

                <button 
                  onClick={() => onDiagnose(condition)}
                  className="w-full py-3 bg-stone-800 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-[0.2em] transition-colors border border-stone-600 hover:border-amber-600 relative z-10"
                >
                  Confirmar este Diagnóstico
                </button>
              </div>
            ))}
            
            {filteredConditions.length === 0 && (
               <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
                 <span className="text-4xl mb-6 opacity-20">✖</span>
                 <p className="font-mono text-center px-8 mb-2">Ninguna coincidencia.</p>
                 <p className="text-xs text-neutral-500 uppercase tracking-wide">Intente modificar los filtros.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
