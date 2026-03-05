
export enum RoomId {
  RECEPTION = 'RECEPTION',
  OFFICE_HOUSE = 'OFFICE_HOUSE',
  PATIENT_ROOM = 'PATIENT_ROOM',
  LAB = 'LAB',
  MEETING_ROOM = 'MEETING_ROOM',
  APARTMENT = 'APARTMENT'
}

export enum CharacterId {
  DR_MAISON = 'DR_MAISON',
  PATIENT = 'PATIENT',
  DR_NEURO = 'DR_NEURO',
  DR_ENDO = 'DR_ENDO',
  DR_GENETIC = 'DR_GENETIC',
  DR_CUDDY = 'DR_CUDDY',
  PARTNER = 'PARTNER'
}

export interface MedicalExam {
  id: string;
  name: string;
  description: string;
  result: string;
  isUnlocked: boolean;
  type: 'BLOOD' | 'IMAGING' | 'MOLECULAR' | 'PHYSICAL' | 'FIELD'; // NEURO devient MOLECULAR
  cost: number; 
  externalUrl?: string; 
  imageUrl?: string;
}

export interface DiagnosticFilters {
  hasFever: boolean | null; 
  hasBleeding: boolean | null; 
  isHcgPositive: boolean | null; 
  pathogen: string; // Molécule identifiée
}

export interface GameState {
  currentRoom: RoomId;
  unlockedExams: string[];
  chatHistory: ChatMessage[];
  isThinking: boolean;
  notes: string[];
  gameStatus: 'MENU' | 'PLAYING' | 'WON' | 'LOST';
  budget: number;
  maxBudget: number;
  difficulty: 'EASY' | 'NORMAL' | 'EXPERT';
}

export interface ChatMessage {
  sender: CharacterId | 'PLAYER' | 'SYSTEM';
  text: string;
  timestamp: number;
  conversationId: CharacterId;
}

export interface Character {
  id: CharacterId;
  name: string;
  specialty?: string;
  description: string;
  imageUrl: string;
  systemPrompt: string;
}

export interface Room {
  id: RoomId;
  name: string;
  description: string;
  imageUrl: string;
  availableCharacters: CharacterId[];
}

export interface CaseData {
  patientName: string;
  age: number;
  presentingSymptoms: string;
  medicalTruth: string;
}

export interface MedicalCondition {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  keyCriteria: {
    hasFever: boolean | null;
    hasBleeding: boolean | null;
    isHcgPositive: boolean | null;
    pathogen?: string; // Molécule impliquée
  };
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}
