import React, { useState } from 'react';
import { PATHOGEN_LIST } from '../constants';

interface GenieGenModalProps {
  url: string; // Gardé pour compatibilité mais on utilise des liens en dur ici
  onClose: () => void;
  onValidate?: () => void;
}

export const GenieGenModal: React.FC<GenieGenModalProps> = ({ url, onClose, onValidate }) => {
  const [selectedPathogen, setSelectedPathogen] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPathogen) return;

    // Validation : LEVONORGESTREL est la bonne réponse pour ce scénario
    if (selectedPathogen.includes('Lévonorgestrel')) {
      if (onValidate) {
        onValidate();
      }
    } else {
        alert("No es la molécula culpable. Observe bien la estructura 3D en comparación con la Progesterona.");
    }
    
    // Fermeture de la fenêtre
    onClose();
  };

  const openMolecule = (url: string) => {
    window.open(url, "_blank");
  };

  const MOLECULES = [
    { name: "Progesterona (REFERENCIA)", url: "https://libmol.org/?pdb=STR", highlight: true },
    { name: "Etinilestradiol", url: "https://libmol.org/?pubchem=5991", highlight: false },
    { name: "Levonorgestrel", url: "https://libmol.org/?pubchem=13109", highlight: false },
    { name: "Ulipristal", url: "https://libmol.org/?pubchem=130904", highlight: false }
  ];

  return (
    <div className="absolute inset-0 bg-black/95 z-[70] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-neutral-900 border border-neutral-700 rounded shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-neutral-800 p-4 flex justify-between items-center border-b border-neutral-700 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-2xl grayscale opacity-70">🧬</span>
            <div>
              <h2 className="text-lg font-bold text-amber-500 uppercase tracking-widest">Laboratorio de Modelado 3D</h2>
              <p className="text-[10px] text-neutral-400 font-mono uppercase">LIBMOL • Identificación Molecular</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={onClose}
                className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded font-bold transition-colors text-xs uppercase tracking-widest border border-stone-600"
            >
                Cerrar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-neutral-900/50">
           
           <div className="h-full flex flex-col md:flex-row">
                {/* Left Column: Instructions & Tools */}
                <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto">
                    
                    <div className="bg-teal-900/20 border-l-4 border-teal-500 p-4 mb-6">
                        <h4 className="text-teal-400 font-bold uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                            Protocolo de Comparación Molecular
                        </h4>
                        <div className="text-neutral-300 text-sm leading-relaxed font-serif space-y-2">
                            <p>1. Abra la <strong className="text-teal-200">Progesterona</strong> (Su referencia natural).</p>
                            <p>2. Abra las otras moléculas una por una.</p>
                            <p>3. Compare su forma 3D en el espacio.</p>
                            <p className="mt-2 font-bold text-white">Pregunta: ¿Qué molécula sintética tiene una estructura 3D casi idéntica a la progesterona (Agonista)?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-6">
                        {MOLECULES.map((mol, idx) => (
                            <button 
                                key={idx}
                                onClick={() => openMolecule(mol.url)}
                                className={`w-full py-3 px-4 font-bold uppercase tracking-widest text-xs border rounded transition-all flex items-center justify-between shadow-lg group
                                    ${mol.highlight 
                                        ? 'bg-teal-800 hover:bg-teal-700 text-white border-teal-500' 
                                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-600 hover:border-amber-500'}
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">⚗️</span> 
                                    {mol.name}
                                </span>
                                <span className="text-[10px] opacity-50 group-hover:opacity-100">Abrir ↗</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] bg-black border border-neutral-700 relative group overflow-hidden rounded-lg p-4 text-center">
                        <span className="text-2xl mb-2">🔐</span>
                        <p className="text-neutral-500 text-xs font-mono">
                          "La clave del misterio se encuentra en la semejanza estructural."
                        </p>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col justify-center bg-neutral-950">
                    <h3 className="text-white font-bold uppercase tracking-widest text-sm border-b border-neutral-800 pb-2 mb-6">
                    Identificación del Culpable
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-neutral-500">¿Qué molécula ha tomado Bridget?</label>
                            <div className="relative">
                                <select 
                                    value={selectedPathogen}
                                    onChange={(e) => setSelectedPathogen(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 p-3 rounded focus:border-amber-500 focus:outline-none appearance-none text-sm"
                                >
                                    <option value="">-- Seleccionar la molécula --</option>
                                    {PATHOGEN_LIST.map(p => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none text-neutral-500 text-xs">▼</div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={!selectedPathogen}
                            className={`w-full py-4 font-bold uppercase tracking-widest transition-all rounded shadow-lg text-xs
                                ${selectedPathogen 
                                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer' 
                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}
                            `}
                        >
                            Validar el Análisis
                        </button>
                        
                        <p className="text-[10px] text-neutral-600 italic text-center leading-relaxed">
                            La Dr. Cuddy espera la identificación precisa de la sustancia ingerida para adaptar los cuidados.
                        </p>
                    </form>
                </div>
           </div>

        </div>

        {/* Pied de page */}
        <div className="bg-neutral-900 p-2 border-t border-neutral-800 text-[10px] text-center text-neutral-500 font-mono uppercase tracking-[0.2em] shrink-0">
          Laboratorio de Bioquímica • Hospital Princeton-Plainsboro
        </div>
      </div>
    </div>
  );
};