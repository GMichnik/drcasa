
import React, { useState, useEffect, useRef } from 'react';
import { 
  GameState, 
  RoomId, 
  CharacterId, 
  ChatMessage, 
  MedicalExam, 
  Character,
  MedicalCondition,
  DiagnosticFilters
} from './types';
import { 
  ROOMS, 
  CHARACTERS, 
  INITIAL_EXAMS, 
  CASE_DATA,
  CHARACTER_SPECIFIC_QUESTIONS,
  SCIENTIFIC_GLOSSARY,
  APARTMENT_SCENES
} from './constants';
import { generateCharacterResponse, getHintFromHouse, getHouseFeedback } from './services/geminiService';
import { MedicalPad } from './components/MedicalPad';
import { MedicalManual } from './components/MedicalManual';
import { RoomView } from './components/RoomView';
import { GenieGenModal } from './components/GenieGenModal';

const getCharactersInRoom = (roomId: RoomId): Character[] => {
  return ROOMS[roomId].availableCharacters.map(id => CHARACTERS[id]);
};

// Complex Formatter to handle both bold and scientific glossary terms
const FormattedText: React.FC<{ 
  text: string; 
  onShowTooltip?: (term: string, def: string, rect: DOMRect) => void;
  onHideTooltip?: () => void;
}> = ({ text, onShowTooltip, onHideTooltip }) => {
  if (!text) return null;

  const boldParts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <span>
      {boldParts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return <strong key={i} className="font-bold text-amber-200">{content}</strong>;
        }

        const glossaryKeys = Object.keys(SCIENTIFIC_GLOSSARY).sort((a, b) => b.length - a.length);
        const glossaryRegex = new RegExp(`(${glossaryKeys.join('|')})`, 'gi');
        const termParts = part.split(glossaryRegex);

        return (
          <React.Fragment key={i}>
            {termParts.map((subPart, j) => {
              const lowerSubPart = subPart.toLowerCase();
              if (SCIENTIFIC_GLOSSARY[lowerSubPart]) {
                return (
                  <span 
                    key={j}
                    className="border-b border-dotted border-amber-500/60 text-amber-100/90 hover:text-amber-400 transition-colors cursor-help"
                    onMouseEnter={(e) => {
                      if (onShowTooltip) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onShowTooltip(subPart, SCIENTIFIC_GLOSSARY[lowerSubPart], rect);
                      }
                    }}
                    onMouseLeave={() => {
                      if (onHideTooltip) onHideTooltip();
                    }}
                  >
                    {subPart}
                  </span>
                );
              }
              return subPart;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};

interface EndGameData {
  status: 'WON' | 'LOST';
  message: string;
  diagnosisName: string;
}

interface TooltipState {
  term: string;
  definition: string;
  rect: DOMRect;
}

// Apartment Exploration Component
const ApartmentExploration: React.FC<{ 
  onFindDiary: () => void; 
  isDiaryFound: boolean; 
}> = ({ onFindDiary, isDiaryFound }) => {
  const [currentScene, setCurrentScene] = useState<keyof typeof APARTMENT_SCENES>('HALL');
  const [diaryTextVisible, setDiaryTextVisible] = useState(false);

  const scene = APARTMENT_SCENES[currentScene];

  const handleAction = (actionId: string) => {
    if (actionId === 'READ_DIARY') {
      setDiaryTextVisible(true);
      if (!isDiaryFound) {
         onFindDiary();
      }
    } else if (APARTMENT_SCENES[actionId as keyof typeof APARTMENT_SCENES]) {
      setCurrentScene(actionId as keyof typeof APARTMENT_SCENES);
      setDiaryTextVisible(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 overflow-hidden">
      {/* Header Fixed */}
      <div className="p-4 md:p-6 border-b border-neutral-800 bg-neutral-900 shrink-0 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <span>🔎</span> Exploración
            </h2>
            <div className="text-xs text-neutral-500 font-mono mt-1">
                Lugar: Apartamento de Bridget Jones
            </div>
        </div>
      </div>

      {/* Content Split: Description (Left) / Actions (Right on XL screens) */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        
        {/* Description Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-neutral-900/50">
            <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700 mb-6 shadow-inner">
                <p className="text-lg text-neutral-200 leading-relaxed font-serif">
                {scene.description}
                </p>
            </div>

            {diaryTextVisible && (
                <div className="bg-white text-black p-6 rounded-sm shadow-xl rotate-1 mb-8 animate-fade-in font-handwriting border border-neutral-300 relative">
                <div className="absolute -top-3 -left-3 text-4xl">📕</div>
                <h3 className="font-bold text-red-800 mb-2 underline">Querido Diario,</h3>
                <p className="mb-2">3h00 de la mañana.</p>
                <p className="mb-4 text-lg">"Mierda... Olvidé protección... Tomé la cosa de emergencia... Espero que vaya bien con el vino. Mark duerme como un tronco. Le quiero. Creo."</p>
                <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded text-center text-green-800 font-bold text-xs uppercase tracking-widest">
                    ✅ Pista añadida al Expediente Médico
                </div>
                </div>
            )}
        </div>

        {/* Actions Sidebar */}
        <div className="w-full xl:w-80 bg-neutral-950 p-4 border-t xl:border-t-0 xl:border-l border-neutral-800 shrink-0 overflow-y-auto z-10 shadow-xl">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Interacciones</h3>
            <div className="flex flex-col gap-2">
                {scene.options.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => handleAction(opt.id)}
                    className="p-3 bg-neutral-800 hover:bg-amber-900/40 border border-neutral-700 hover:border-amber-600 rounded text-left transition-all group shadow-md flex flex-col"
                >
                    <span className="text-[9px] text-neutral-500 uppercase tracking-widest mb-0.5 group-hover:text-amber-500">Acción</span>
                    <span className="font-bold text-neutral-200 text-sm">{opt.label}</span>
                </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentRoom: RoomId.RECEPTION,
    unlockedExams: ['anamnese'],
    chatHistory: [],
    isThinking: false,
    notes: [],
    gameStatus: 'MENU', 
    budget: 2000,
    maxBudget: 2000,
    difficulty: 'EXPERT'
  });

  const [activeCharacter, setActiveCharacter] = useState<CharacterId | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isPadOpen, setIsPadOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [diagnosticFilters, setDiagnosticFilters] = useState<DiagnosticFilters>({
    hasFever: null,
    hasBleeding: null,
    isHcgPositive: null,
    pathogen: ''
  });
  const [exams, setExams] = useState<MedicalExam[]>(INITIAL_EXAMS);
  const [endGameData, setEndGameData] = useState<EndGameData | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [hasNewResults, setHasNewResults] = useState(false);
  const [lastUnlockedExamName, setLastUnlockedExamName] = useState<string | null>(null);
  const [suggestedExamIds, setSuggestedExamIds] = useState<string[]>([]);
  const [currentExternalToolUrl, setCurrentExternalToolUrl] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.chatHistory, activeCharacter]);

  const startGame = (difficulty: 'EASY' | 'NORMAL' | 'EXPERT') => {
    const startingBudget = difficulty === 'EXPERT' ? 2000 : 999999;
    setGameState(prev => ({
      ...prev,
      gameStatus: 'PLAYING',
      difficulty: difficulty,
      budget: startingBudget,
      maxBudget: startingBudget
    }));
  };

  const resetGame = () => {
    setGameState({
      currentRoom: RoomId.RECEPTION,
      unlockedExams: ['anamnese'],
      chatHistory: [],
      isThinking: false,
      notes: [],
      gameStatus: 'MENU',
      budget: 2000,
      maxBudget: 2000,
      difficulty: 'EXPERT'
    });
    setActiveCharacter(null);
    setUserInput('');
    setIsPadOpen(false);
    setIsManualOpen(false);
    setEndGameData(null);
    setIsDiagnosing(false);
    setHasNewResults(false);
    setSuggestedExamIds([]);
    setCurrentExternalToolUrl(null);
    setActiveTooltip(null);
    setExams(INITIAL_EXAMS.map(exam => ({ ...exam })));
    setDiagnosticFilters({
      hasFever: null,
      hasBleeding: null,
      isHcgPositive: null,
      pathogen: ''
    });
  };

  const handleSendMessage = async (e?: React.FormEvent, manualInput?: string) => {
    e?.preventDefault();
    const inputToSend = manualInput || userInput;
    if (!inputToSend.trim() || !activeCharacter || gameState.isThinking) return;

    setUserInput('');
    const userMsg: ChatMessage = { 
        sender: 'PLAYER', 
        text: inputToSend, 
        timestamp: Date.now(),
        conversationId: activeCharacter 
    };
    
    const character = CHARACTERS[activeCharacter];
    const aiMsgPlaceholder: ChatMessage = { 
        sender: character.id, 
        text: "...", 
        timestamp: Date.now() + 1,
        conversationId: activeCharacter 
    };
    
    setGameState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg, aiMsgPlaceholder],
      isThinking: true
    }));

    const conversationHistory = gameState.chatHistory.filter(m => m.conversationId === activeCharacter);
    
    const onChunk = (streamedText: string) => {
        setGameState(prev => {
            const newHistory = [...prev.chatHistory];
            const lastIndex = newHistory.length - 1;
            if (newHistory[lastIndex].sender === character.id) {
                 newHistory[lastIndex] = {
                    ...newHistory[lastIndex],
                    text: streamedText
                 };
            }
            return { ...prev, chatHistory: newHistory };
        });
    };
    
    let responseText = await generateCharacterResponse(
      character, 
      inputToSend, 
      conversationHistory, 
      CASE_DATA,
      exams,
      gameState.difficulty,
      onChunk
    );

    const tagRegex = /\[SUGGEST:\s*(.*?)\]/g;
    const newSuggestions = new Set(suggestedExamIds);
    let match;
    while ((match = tagRegex.exec(responseText)) !== null) {
      const examId = match[1].trim();
      if (exams.find(e => e.id === examId && !e.isUnlocked)) {
        newSuggestions.add(examId);
      }
    }
    
    const cleanText = responseText.replace(tagRegex, '').trim();
    setSuggestedExamIds(Array.from(newSuggestions));

    setGameState(prev => {
        const newHistory = [...prev.chatHistory];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex].sender === character.id) {
                newHistory[lastIndex] = {
                ...newHistory[lastIndex],
                text: cleanText
                };
        }
        return {
            ...prev,
            chatHistory: newHistory,
            isThinking: false
        }
    });
  };

  const changeRoom = (RoomId: RoomId) => {
    setGameState(prev => ({ ...prev, currentRoom: RoomId }));
    setActiveCharacter(null);
  };

  const unlockExam = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    if (gameState.budget < exam.cost) {
      alert("Budget insuffisant !");
      return;
    }

    const examsToUnlockIds = [examId];
    if (examId === 'camp_inspection') {
      examsToUnlockIds.push('erythema_photo');
    }

    setExams(prev => prev.map(ex => examsToUnlockIds.includes(ex.id) ? { ...ex, isUnlocked: true } : ex));
    
    setGameState(prev => ({
      ...prev,
      budget: prev.budget - exam.cost,
      unlockedExams: [...prev.unlockedExams, ...examsToUnlockIds],
      chatHistory: [...prev.chatHistory, { 
          sender: 'SYSTEM', 
          text: `GASTO: ${exam.cost} Créditos. RESULTADO DISPONIBLE: ${exam.name}`, 
          timestamp: Date.now(),
          conversationId: activeCharacter || CharacterId.DR_MAISON
      }] 
    }));

    setHasNewResults(true);
    setLastUnlockedExamName(exam.name);
    setTimeout(() => setLastUnlockedExamName(null), 4000);
    setSuggestedExamIds(prev => prev.filter(id => id !== examId));

    if (exam?.externalUrl) setCurrentExternalToolUrl(exam.externalUrl);
  };

  const handleMicroscopeValidation = () => {
    setExams(prev => prev.map(ex => 
      ex.id === 'libmol_sim' 
        ? { ...ex, result: "ANÁLISIS MOLECULAR CONFIRMADO: La molécula tomada es el LEVONORGESTREL. Estructura similar a la Progesterona (Agonista). Excluye el Ulipristal." } 
        : ex
    ));
    setHasNewResults(true);
    setLastUnlockedExamName("MOLÉCULA IDENTIFICADA");
    setTimeout(() => setLastUnlockedExamName(null), 4000);
  };

  // --- MENU SCREEN ---
  if (gameState.gameStatus === 'MENU') {
    return (
      <div className="flex h-screen w-full bg-neutral-950 items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://nuage02.apps.education.fr/index.php/s/SHbtyntmbPmTZ3t/download')] opacity-20 bg-cover bg-center grayscale blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
        <div className="relative z-10 max-w-5xl w-full bg-black/40 backdrop-blur-md border border-neutral-800 p-8 md:p-12 rounded-2xl shadow-2xl flex flex-col items-center text-center overflow-y-auto max-h-screen">
          <h1 className="text-4xl md:text-6xl font-black text-amber-500 tracking-tighter mb-2 uppercase drop-shadow-lg">Dr. Casa</h1>
          <h2 className="text-xl md:text-2xl font-mono text-neutral-400 mb-12 tracking-widest uppercase">Caso Clínico #4: Bridget Jones</h2>
          <div className="grid md:grid-cols-3 gap-6 w-full">
             <button onClick={() => startGame('EASY')} className="group relative bg-neutral-900/80 hover:bg-emerald-900/30 border border-neutral-700 hover:border-emerald-500 p-6 rounded-xl transition-all duration-300 flex flex-col items-center gap-4 hover:scale-105 shadow-lg">
              <div className="w-14 h-14 rounded-full bg-neutral-800 group-hover:bg-emerald-600 flex items-center justify-center text-3xl transition-colors">🌱</div>
              <div className="text-center"><h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Modo Descubrimiento</h3><span className="inline-block bg-emerald-900 text-emerald-200 text-[10px] font-bold px-2 py-1 rounded mb-3">LECTURA FÁCIL</span><p className="text-xs text-neutral-400 font-serif leading-relaxed">Diálogos cortos y simplificados.<br/><span className="text-emerald-400 font-bold mt-2 block">Presupuesto Ilimitado</span></p></div>
            </button>
            <button onClick={() => startGame('NORMAL')} className="group relative bg-neutral-900/80 hover:bg-teal-900/30 border border-neutral-700 hover:border-teal-500 p-6 rounded-xl transition-all duration-300 flex flex-col items-center gap-4 hover:scale-105 shadow-lg">
              <div className="w-14 h-14 rounded-full bg-neutral-800 group-hover:bg-teal-600 flex items-center justify-center text-3xl transition-colors">🎓</div>
              <div className="text-center"><h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Modo Interno</h3><span className="inline-block bg-teal-900 text-teal-200 text-[10px] font-bold px-2 py-1 rounded mb-3">RECOMENDADO</span><p className="text-xs text-neutral-400 font-serif leading-relaxed">Experiencia estándar.<br/><span className="text-teal-400 font-bold mt-2 block">Presupuesto Ilimitado</span></p></div>
            </button>
            <button onClick={() => startGame('EXPERT')} className="group relative bg-neutral-900/80 hover:bg-red-900/20 border border-neutral-700 hover:border-red-500 p-6 rounded-xl transition-all duration-300 flex flex-col items-center gap-4 hover:scale-105 shadow-lg">
              <div className="w-14 h-14 rounded-full bg-neutral-800 group-hover:bg-red-700 flex items-center justify-center text-3xl transition-colors">💊</div>
              <div className="text-center"><h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Modo Experto</h3><span className="inline-block bg-red-900 text-red-200 text-[10px] font-bold px-2 py-1 rounded mb-3">DIFÍCIL</span><p className="text-xs text-neutral-400 font-serif leading-relaxed">Presupuesto gestionado.<br/><span className="text-red-400 font-bold mt-2 block">Presupuesto Estricto (2000$)</span></p></div>
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-neutral-800/50 w-full flex flex-col items-center gap-4">
             <div className="flex flex-wrap justify-center gap-4">
                 <a href="mailto:gregory.michnik@ac-lille.fr" className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded border border-neutral-700 transition-all"><span>✉️</span> Contactarme</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentRoomData = ROOMS[gameState.currentRoom];
  const charactersInRoom = getCharactersInRoom(gameState.currentRoom);
  const currentMessages = activeCharacter ? gameState.chatHistory.filter(m => m.conversationId === activeCharacter) : [];
  const budgetPercentage = (gameState.budget / gameState.maxBudget) * 100;

  return (
    <div className="flex h-screen w-full bg-neutral-900 text-neutral-200 font-sans">
      {lastUnlockedExamName && (
        <div className="fixed top-6 right-6 z-[100] pointer-events-none animate-float-notification">
          <div className="bg-teal-600 text-white px-6 py-4 rounded shadow-2xl border border-teal-400 flex items-center gap-3">
             <span className="text-xl">📄</span>
             <div>
               <p className="font-bold text-sm uppercase tracking-wider">Resultado disponible</p>
               <p className="text-xs opacity-90">{lastUnlockedExamName} añadido al expediente.</p>
             </div>
          </div>
        </div>
      )}

      {activeTooltip && (
        <div 
          className="fixed z-[9999] pointer-events-none w-64 p-3 bg-neutral-900/95 backdrop-blur-md border border-neutral-700 text-neutral-200 text-xs rounded shadow-2xl animate-fade-in"
          style={{
            top: activeTooltip.rect.top < 150 ? activeTooltip.rect.bottom + 10 : activeTooltip.rect.top - 10,
            left: activeTooltip.rect.left + activeTooltip.rect.width / 2,
            transform: activeTooltip.rect.top < 150 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
          }}
        >
          <span className="block font-bold text-amber-500 uppercase mb-1 tracking-widest text-[10px] border-b border-neutral-800 pb-1">{activeTooltip.term}</span>
          <span className="leading-relaxed block">{activeTooltip.definition}</span>
          <div className={`absolute left-1/2 -translate-x-1/2 border-8 border-transparent ${activeTooltip.rect.top < 150 ? 'bottom-full border-b-neutral-900/95' : 'top-full border-t-neutral-900/95'}`}></div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-20 md:w-64 flex flex-col border-r border-neutral-800 bg-neutral-950 flex-shrink-0 z-40 shadow-xl">
        <div className="p-4 border-b border-neutral-800 bg-black/20 flex items-center justify-center md:justify-start gap-3">
          <div className="w-10 h-10 border-2 border-neutral-700 md:border-amber-600 flex items-center justify-center shrink-0 rounded-sm bg-neutral-900 shadow-lg"><span className="text-amber-600 font-serif font-bold text-2xl pt-1">H</span></div>
          <div className="hidden md:block overflow-hidden"><h1 className="text-sm font-bold tracking-tighter text-amber-600 uppercase font-mono truncate">PRINCETON-PLAINSBORO</h1><h2 className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Departamento de Diagnóstico</h2></div>
        </div>
        {gameState.difficulty === 'EXPERT' ? (
          <div className="p-4 border-b border-neutral-800 bg-black/10">
            <div className="flex justify-between items-end mb-2"><span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Presupuesto Clínico</span><span className={`text-xs font-mono font-bold ${gameState.budget < 300 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>{gameState.budget} $</span></div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden border border-neutral-700"><div className={`h-full transition-all duration-1000 ${gameState.budget < 300 ? 'bg-red-600' : gameState.budget < 800 ? 'bg-amber-600' : 'bg-teal-600'}`} style={{ width: `${budgetPercentage}%` }}/></div>
          </div>
        ) : (
           <div className="p-4 border-b border-neutral-800 bg-black/10"><div className="flex justify-between items-end"><span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Presupuesto</span><span className="text-xs font-mono font-bold text-teal-500">ILIMITADO</span></div></div>
        )}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {Object.values(ROOMS).map(room => (
            <button key={room.id} onClick={() => changeRoom(room.id)} className={`w-full text-left px-4 py-3 flex items-center transition-all duration-200 ${gameState.currentRoom === room.id ? 'bg-teal-900/30 text-teal-400 border-r-2 border-teal-500' : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300 border-r-2 border-transparent'}`}>
              <div className="w-3 h-3 rounded-full bg-current mr-3 flex-shrink-0" />
              <span className="hidden md:inline text-sm font-medium tracking-wide">{room.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-950">
          <button onClick={() => { setIsPadOpen(true); setHasNewResults(false); }} className={`w-full py-3 px-3 rounded text-sm font-bold shadow-lg flex items-center justify-center gap-2 border transition-all relative ${hasNewResults ? 'bg-cyan-900/50 border-cyan-500 text-cyan-100 animate-pulse-cyan' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'}`}>
            {hasNewResults && (<span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span></span>)}
            <span>📋</span> <span className="hidden md:inline">Expediente Médico</span>
          </button>
          <button onClick={() => gameState.gameStatus === 'PLAYING' && setIsManualOpen(true)} disabled={gameState.gameStatus !== 'PLAYING'} className={`w-full py-3 px-3 rounded text-sm font-bold shadow-lg flex items-center justify-center gap-2 border transition-colors ${gameState.gameStatus === 'PLAYING' ? 'bg-amber-700 hover:bg-amber-600 text-white border-amber-800' : 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed opacity-50'}`}><span>📚</span> <span className="hidden md:inline">Diagnóstico</span></button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col ${gameState.currentRoom === RoomId.APARTMENT ? '' : 'lg:flex-row'} h-full relative bg-neutral-900 overflow-hidden z-30`}>
        
        {/* ROOM / APARTMENT VIEW */}
        <div className={`
            shrink-0 relative border-neutral-800
            ${gameState.currentRoom === RoomId.APARTMENT 
                ? 'w-full h-1/2 border-b' 
                : 'w-full lg:w-[45%] h-[40vh] lg:h-full border-b lg:border-b-0 lg:border-r'
            }
        `}>
           <RoomView 
              room={currentRoomData} 
              charactersInRoom={charactersInRoom}
              activeCharacterId={activeCharacter}
              onCharacterClick={setActiveCharacter}
              enableExploration={gameState.currentRoom === RoomId.APARTMENT}
           />
        </div>

        {/* CHAT / EXPLORATION INTERFACE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950 z-10">
          {gameState.currentRoom === RoomId.APARTMENT ? (
            // EXPLORATION INTERFACE
            <ApartmentExploration 
              onFindDiary={() => unlockExam('diary_clue')}
              isDiaryFound={exams.find(e => e.id === 'diary_clue')?.isUnlocked || false}
            />
          ) : (
            // CHAT INTERFACE
            <div className="flex-1 flex flex-col p-4 md:p-6 w-full h-full relative">
              {activeCharacter ? (
                <>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-neutral-800 shrink-0">
                    <div className="w-12 h-12 rounded overflow-hidden border border-neutral-700 shadow-md bg-black">
                      <img src={CHARACTERS[activeCharacter].imageUrl} className="w-full h-full object-cover opacity-90" alt="Avatar" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-amber-500 tracking-wide uppercase">{CHARACTERS[activeCharacter].name}</h3>
                      <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">{CHARACTERS[activeCharacter].specialty || 'Patient'}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                    {currentMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'PLAYER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[95%] rounded px-5 py-3 text-sm shadow-md whitespace-pre-wrap break-words leading-relaxed transition-all ${msg.sender === 'PLAYER' ? 'bg-teal-900 text-teal-50 border border-teal-800' : msg.sender === 'SYSTEM' ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 font-mono text-[10px]' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'}`}>
                          <FormattedText text={msg.text} onShowTooltip={(term, def, rect) => setActiveTooltip({term, definition: def, rect})} onHideTooltip={() => setActiveTooltip(null)} />
                        </div>
                      </div>
                    ))}
                    {gameState.isThinking && !currentMessages[currentMessages.length - 1]?.text && (<div className="text-xs text-neutral-600 animate-pulse font-mono px-6">Análisis en curso...</div>)}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="shrink-0 space-y-3 mb-4">
                    {suggestedExamIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exams.filter(ex => suggestedExamIds.includes(ex.id) && !ex.isUnlocked).map(exam => (
                          <button key={exam.id} onClick={() => unlockExam(exam.id)} className="px-4 py-2 bg-neutral-900 border border-teal-900 hover:border-teal-500 text-teal-100 text-[10px] font-bold uppercase rounded shadow-lg flex items-center gap-2 transition-all hover:scale-105">
                            <span className="bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800 text-teal-400">-{exam.cost} $</span><span>🔬 Lanzar: {exam.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {activeCharacter && CHARACTER_SPECIFIC_QUESTIONS[activeCharacter]?.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {CHARACTER_SPECIFIC_QUESTIONS[activeCharacter].map((suggestion, i) => (
                          <button key={i} onClick={() => handleSendMessage(undefined, suggestion.text)} disabled={gameState.isThinking} className="whitespace-nowrap px-4 py-2 bg-neutral-800/50 border border-neutral-700 hover:bg-amber-900/20 hover:border-amber-700/50 rounded text-[10px] uppercase font-bold text-neutral-400 hover:text-amber-200 transition-all shadow-sm flex-shrink-0">{suggestion.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 shrink-0">
                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={`Hablar con ${CHARACTERS[activeCharacter].name}...`} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-5 py-4 focus:outline-none focus:border-amber-600 text-sm text-neutral-200" disabled={gameState.isThinking} />
                    <button type="submit" disabled={gameState.isThinking || !userInput.trim()} className="bg-neutral-800 hover:bg-amber-700 text-white px-8 py-2 rounded-lg font-bold uppercase text-xs border border-neutral-700 transition-all shadow-lg active:scale-95">Enviar</button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-4">
                  <div className="w-16 h-16 rounded-full border-2 border-neutral-800 flex items-center justify-center opacity-30 animate-pulse"><span className="text-3xl">💬</span></div>
                  <p className="text-xs italic font-mono uppercase tracking-widest opacity-50">SELECCIONE UN MIEMBRO DEL EQUIPO</p>
                  <p className="text-[10px] text-neutral-600 max-w-xs text-center">(Haga clic en un personaje en la escena de la izquierda para iniciar la consulta)</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isDiagnosing && (<div className="fixed inset-0 z-[110] bg-black/90 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm"><div className="w-16 h-16 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin mb-6"></div><h2 className="text-xl font-bold text-amber-500 tracking-widest uppercase animate-pulse">Dr. Casa analiza...</h2></div>)}
      {currentExternalToolUrl && <GenieGenModal url={currentExternalToolUrl} onClose={() => setCurrentExternalToolUrl(null)} onValidate={handleMicroscopeValidation} />}
      {isPadOpen && <MedicalPad exams={exams.filter(e => e.isUnlocked)} onClose={() => setIsPadOpen(false)} onOpenExternalTool={setCurrentExternalToolUrl} />}
      {isManualOpen && <MedicalManual onClose={() => setIsManualOpen(false)} onDiagnose={async (c) => { setIsManualOpen(false); setIsDiagnosing(true); const fb = await getHouseFeedback(c.id, c.id === 'effet_levonorgestrel', CASE_DATA); setIsDiagnosing(false); setGameState(prev => ({ ...prev, gameStatus: c.id === 'effet_levonorgestrel' ? 'WON' : 'LOST' })); setEndGameData({ status: c.id === 'effet_levonorgestrel' ? 'WON' : 'LOST', message: fb, diagnosisName: c.name }); }} filters={diagnosticFilters} onFilterChange={setDiagnosticFilters} />}
      {endGameData && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-700 rounded p-10 text-center shadow-2xl relative">
                <h2 className={`text-5xl font-bold mb-4 tracking-tighter ${endGameData.status === 'WON' ? 'text-teal-500' : 'text-red-500'}`}>{endGameData.status === 'WON' ? 'CASO RESUELTO' : 'DERROTA'}</h2>
                <p className="text-2xl text-white mb-10 font-mono tracking-widest uppercase">{endGameData.diagnosisName}</p>
                <div className="bg-neutral-800/50 p-8 rounded mb-10 text-left border-l-2 border-amber-600"><p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">Dr. Casa</p><p className="text-lg italic text-neutral-300 leading-relaxed font-serif">"{endGameData.message}"</p><div className="mt-6 pt-6 border-t border-neutral-700 text-xs text-neutral-500">Presupuesto final: {gameState.budget} $ / {gameState.maxBudget} $</div></div>
                <button onClick={resetGame} className="bg-stone-800 hover:bg-stone-700 text-white px-12 py-4 rounded-lg border border-stone-600 font-bold uppercase tracking-widest transition-all">REINICIAR</button>
            </div>
        </div>
      )}
      <button onClick={() => setShowCredits(true)} className="fixed bottom-4 right-4 z-50 bg-neutral-900/90 hover:bg-amber-900/90 text-neutral-400 hover:text-amber-100 p-3 rounded-full border border-neutral-700 transition-all shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg></button>
      {showCredits && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCredits(false)}>
          <div className="bg-neutral-900 border border-neutral-600 rounded-lg shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-amber-500 mb-4 uppercase">Créditos</h3>
            <div className="space-y-3 text-sm font-mono text-neutral-300"><div><span className="text-neutral-500 text-xs uppercase">Autor</span><br/><span className="font-bold">Grégory Michnik</span></div><div><span className="text-neutral-500 text-xs uppercase">Contacto</span><br/><a href="mailto:gregory.michnik@ac-lille.fr" className="text-teal-400 hover:underline">gregory.michnik@ac-lille.fr</a></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
