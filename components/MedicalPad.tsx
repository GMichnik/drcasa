import React from 'react';
import { MedicalExam } from '../types';

interface MedicalPadProps {
  exams: MedicalExam[];
  onClose: () => void;
  onOpenExternalTool?: (url: string) => void;
}

export const MedicalPad: React.FC<MedicalPadProps> = ({ exams, onClose, onOpenExternalTool }) => {
  // Group exams by type
  const groupedExams = exams.reduce((acc, exam) => {
    if (!acc[exam.type]) acc[exam.type] = [];
    acc[exam.type].push(exam);
    return acc;
  }, {} as Record<string, MedicalExam[]>);

  const typeLabels: Record<string, string> = {
    'PHYSICAL': 'Examen Clínico',
    'BLOOD': 'Biología Sanguínea',
    'IMAGING': 'Imagenología Médica',
    'MOLECULAR': 'Análisis Molecular (3D)', 
    'FIELD': 'Investigación de Campo' 
  };

  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-50 text-neutral-900 w-full max-w-3xl h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden relative border border-neutral-600">
        {/* Header */}
        <div className="bg-neutral-900 p-4 text-neutral-100 flex justify-between items-center border-b-4 border-amber-600">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold font-mono tracking-wider uppercase">Expediente Médico</h2>
            <span className="text-[10px] text-neutral-400 font-mono">REF: PPTH-2025-BRDGT</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors text-xs font-bold border border-neutral-600 px-3 py-1 rounded">
            CERRAR [ESC]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-100 custom-scrollbar">
            
          {/* Patient Identity Card */}
          <div className="bg-white p-6 shadow-sm border border-stone-300 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-stone-800"></div>
            
            <div className="flex justify-between items-end border-b border-stone-200 pb-2 mb-4">
                 <h3 className="text-stone-500 font-bold uppercase tracking-widest text-xs">Ficha de Admisión</h3>
                 <div className="flex gap-1 opacity-30">
                     <div className="w-px h-6 bg-black"></div>
                     <div className="w-1 h-6 bg-black"></div>
                     <div className="w-px h-6 bg-black"></div>
                     <div className="w-2 h-6 bg-black"></div>
                 </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm font-mono text-neutral-800 relative z-10">
                <div className="col-span-2">
                    <span className="block text-stone-400 text-[10px] uppercase mb-1">Nombre del Paciente</span>
                    <span className="font-bold text-xl md:text-2xl tracking-tight text-neutral-900">JONES, Bridget</span>
                </div>
                <div>
                    <span className="block text-stone-400 text-[10px] uppercase mb-1">Nacido(a) el</span>
                    <span className="font-semibold">09/05/1992</span>
                </div>
                 <div>
                    <span className="block text-stone-400 text-[10px] uppercase mb-1">Edad</span>
                    <span className="font-semibold">32 Años</span>
                </div>
                <div>
                    <span className="block text-stone-400 text-[10px] uppercase mb-1">Grupo Sanguíneo</span>
                    <span className="text-red-800 font-bold border border-red-200 bg-red-50 px-2 py-0.5 inline-block rounded">A Positivo</span>
                </div>
                <div>
                    <span className="block text-stone-400 text-[10px] uppercase mb-1">Profesión</span>
                    <span className="font-semibold">Productora TV</span>
                </div>
                 <div className="col-span-2">
                    <span className="block text-stone-400 text-[10px] uppercase mb-1">Motivo de Admisión</span>
                    <span className="italic text-neutral-600">Dolores abdominales agudos, sangrados, ansiedad masiva.</span>
                </div>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-4">
              <div className="h-px bg-stone-300 flex-1"></div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Historial de Exámenes</span>
              <div className="h-px bg-stone-300 flex-1"></div>
          </div>

          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 border-2 border-dashed border-stone-200 rounded bg-stone-50/50">
                <span className="text-4xl mb-3 grayscale opacity-30">📂</span>
                <p className="italic font-mono text-sm">Ningún examen prescrito por el momento.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(groupedExams).map(type => (
                <div key={type} className="border-l-2 border-stone-400 pl-6 relative">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-stone-400 border-2 border-stone-100 shadow-sm"></div>
                  <h3 className="text-stone-600 font-bold uppercase mb-4 text-xs tracking-[0.2em] flex items-center gap-2">
                    {typeLabels[type] || type}
                  </h3>
                  <div className="grid gap-4">
                    {groupedExams[type].map(exam => (
                      <div key={exam.id} className="bg-white p-5 shadow-sm border border-stone-200 relative group transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-neutral-900 text-lg">{exam.name}</h4>
                          {exam.externalUrl && onOpenExternalTool && (
                            <button 
                              onClick={() => onOpenExternalTool(exam.externalUrl!)}
                              className="text-[10px] uppercase font-bold tracking-wider bg-teal-50 text-teal-800 px-2 py-1 border border-teal-200 hover:bg-teal-100 transition-colors rounded flex items-center gap-1"
                            >
                              <span>🧬</span> Lanzar Libmol
                            </button>
                          )}
                        </div>
                        
                        {/* Display Exam Image if available */}
                        {exam.imageUrl && (
                          <div className="mb-4 bg-black rounded overflow-hidden border border-stone-300">
                             <img 
                              src={exam.imageUrl} 
                              alt={exam.name} 
                              className="w-full h-auto max-h-80 object-contain mx-auto" 
                             />
                          </div>
                        )}

                        <p className="text-stone-600 text-sm mb-4 leading-relaxed font-serif">{exam.description}</p>
                        <div className="bg-amber-50/50 p-4 border-l-2 border-amber-400/50 text-neutral-800 font-mono text-sm">
                          <strong className="text-amber-800/80 block mb-1 text-xs uppercase tracking-wide">Resultado:</strong> 
                          {exam.result}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-stone-200 p-3 border-t border-stone-300 text-[10px] text-center text-stone-500 uppercase tracking-widest font-mono">
          Hospital Universitario Princeton-Plainsboro • Departamento de Diagnóstico • Confidencial
        </div>
      </div>
    </div>
  );
};