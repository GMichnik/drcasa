import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Character, CaseData, ChatMessage, MedicalExam, CharacterId } from '../types';

// Use the API key directly from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to delay execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes an API call with retry logic for rate limits (429).
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Robust check for rate limit errors from different possible error structures
    const isRateLimit = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.statusCode === 429 ||
      (typeof error?.message === 'string' && (
        error.message.includes('429') || 
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('quota')
      )) ||
      (error?.error && (
        error.error.code === 429 ||
        error.error.status === 'RESOURCE_EXHAUSTED'
      ));

    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API Quota exceeded. Retrying in ${delay}ms... (Retries left: ${retries})`);
      await wait(delay);
      return withRetry(operation, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

/**
 * Generates a response from a specific character based on the conversation history and the medical case.
 * Supports streaming via the optional onChunk callback.
 */
export const generateCharacterResponse = async (
  character: Character,
  userMessage: string,
  history: ChatMessage[],
  caseData: CaseData,
  exams: MedicalExam[],
  difficulty: 'EASY' | 'NORMAL' | 'EXPERT' = 'NORMAL',
  onChunk?: (text: string) => void
): Promise<string> => {
  // Use gemini-3-flash-preview for faster chat responses.
  const model = "gemini-3-flash-preview";

  // Build a concise history string
  const conversationContext = history.slice(-10).map(msg => 
    `${msg.sender === 'PLAYER' ? 'Interno (Jugador)' : msg.sender}: ${msg.text}`
  ).join('\n');

  // --- GAMEPLAY MECHANIC: SPECIALTY RESTRICTIONS ---
  const ALLOWED_TYPES: Record<string, string[]> = {
    [CharacterId.DR_MAISON]: ['BLOOD', 'IMAGING', 'MOLECULAR', 'PHYSICAL'], 
    [CharacterId.DR_ENDO]: ['BLOOD', 'MOLECULAR'], 
    [CharacterId.DR_GENETIC]: ['BLOOD', 'IMAGING'], 
    [CharacterId.DR_NEURO]: ['PHYSICAL', 'NEURO'], 
    [CharacterId.PARTNER]: [], // Darcy ne prescrit rien et ne peut pas fouiller à distance
    [CharacterId.DR_CUDDY]: [], // Cuddy ne prescrit RIEN
    [CharacterId.PATIENT]: [] 
  };

  const myAllowedTypes = ALLOWED_TYPES[character.id] || [];
  
  // Create lists for the prompt
  const examsContext = exams.map(e => 
    `- Nombre: "${e.name}" (ID: ${e.id}, Tipo: ${e.type}). Estado: ${e.isUnlocked ? `YA HECHO. RESULTADO: ${e.result}` : 'NO HECHO'}`
  ).join('\n');

  const authorizedExams = exams.filter(e => !e.isUnlocked && myAllowedTypes.includes(e.type));
  const authorizedExamsList = authorizedExams.map(e => `- ${e.name} (ID: ${e.id})`).join('\n');

  // Check if diary is found
  const isDiaryFound = exams.find(e => e.id === 'diary_clue')?.isUnlocked;

  // --- DIFFICULTY ADJUSTMENTS ---
  let styleInstruction = "";
  if (difficulty === 'EASY') {
    styleInstruction = `
      MODO "FÁCIL" ACTIVADO (IMPORTANTE):
      - Haz frases MUY CORTAS.
      - Usa un vocabulario SIMPLE.
    `;
  } else {
    styleInstruction = `
      - Estilo: Adopta el tono específico de tu personaje (Sarcasmo autorizado para Dr. Casa, Pánico para Bridget).
      - Vocabulario médico preciso requerido para los doctores.
    `;
  }

  const systemInstruction = `
    ${character.systemPrompt}
    
    IMPORTANTE: En todo este universo, el jefe del departamento de diagnóstico se llama "Dr. Casa". 
    
    CONTEXTO DEL JUEGO (Bridget Jones):
    Bridget está enferma después de una noche de fiesta.
    SECRETO DEL JUEGO: Ella tomó una píldora del día después (Levonorgestrel) pero lo OLVIDÓ debido al alcohol.
    
    DATOS MÉDICOS (LA VERDAD DEL CASO - SECRETO ABSOLUTO):
    ${caseData.medicalTruth}

    ESTADO DE LOS EXÁMENES (GLOBAL):
    ${examsContext}

    REGLAS ABSOLUTAS DE NO RESOLUCIÓN (ANTI-SPOILER):
    1. MIENTRAS EL EXAMEN "Búsqueda: Pista Diario" NO ESTÉ HECHO:
       - NO DEBES mencionar la "píldora del día después" o el "Levonorgestrel".
       - No sabes lo que ella tomó. Solo sospechas un problema hormonal, estrés o alcohol.
       - Cuddy debe decir: "Yo gestiono lo administrativo. Encuentren lo que tiene."
       - Casa debe decir: "Ella miente o lo ha olvidado. Vayan a registrar su apartamento."
    
    2. UNA VEZ ENCONTRADO EL DIARIO (Prueba de la toma):
       - Puedes confirmar que es una pista seria (anticoncepción de emergencia).
       - Puedes pedir verificar la estructura molecular (Libmol).
       - PROHIBICIÓN FORMAL: NUNCA des la respuesta "Es el Levonorgestrel".
       - INSTRUCCIÓN: Envía siempre al jugador al botón "Diagnóstico" para validar su teoría. "Si es tan listo, vaya a rellenar el Diagnóstico Diferencial."

    REGLAS DE PRESCRIPCIÓN (CRUCIAL):
    Solo puedes prescribir (vía el tag SUGGEST) los exámenes de tu especialidad.
    TUS TIPOS AUTORIZADOS: ${myAllowedTypes.length > 0 ? myAllowedTypes.join(', ') : "NINGUNO"}.
    
    LISTA DE EXÁMENES QUE PUEDES DESBLOQUEAR AHORA:
    ${authorizedExamsList || "(Ningún examen disponible para tu especialidad o todo ya está hecho)"}

    MECÁNICA DE JUEGO:
    1. Si el alumno te pide un examen de tu lista, di sí y AÑADE EL TAG: [SUGGEST: id_examen].
    2. Si no, rechaza explicando que no es tu trabajo.
    
    CONSIGNAS DE ESTILO:
    ${styleInstruction}
  `;

  try {
    const response = await withRetry(() => ai.models.generateContentStream({
      model: model,
      contents: `Historial de conversación:\n${conversationContext}\n\nÚltima pregunta del Interno (Jugador): ${userMessage}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: difficulty === 'EASY' ? 0.5 : 0.7, 
        maxOutputTokens: 2000,
      }
    }));

    let fullText = '';
    for await (const chunk of (response as AsyncIterable<GenerateContentResponse>)) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            if (onChunk) onChunk(fullText);
        }
    }

    return fullText || "...";
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.message?.includes('RESOURCE_EXHAUSTED') || 
      error?.status === 429;
    
    if (isQuotaError) {
        return "(HRP: Error de cuota API (429). El sistema está sobrecargado, por favor espere unos instantes antes de volver a intentarlo.)";
    }

    return "Lo siento, estoy perdido en mis pensamientos... (Error API)";
  }
};

export const getHintFromHouse = async (unlockedExamsNames: string[], caseData: CaseData): Promise<string> => {
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `El jugador ha descubierto: ${unlockedExamsNames.join(', ')}. Da una pista.`,
      config: {
        systemInstruction: "Eres el Dr. Casa. Si el diario no se ha encontrado: di de registrar el apartamento. Si el diario se ha encontrado: di de comparar el Levonorgestrel con la Progesterona en Libmol.",
        temperature: 0.8,
        maxOutputTokens: 500,
      }
    }));
    return response.text || "Busquen más.";
  } catch (e) {
    return "No voy a hacer el trabajo por usted. (Error API)";
  }
};

export const getHouseFeedback = async (diagnosisId: string, isCorrect: boolean, caseData: CaseData): Promise<string> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    CONTEXTO: Juego de rol médico "Dr. Casa" para estudiantes de secundaria. Tema: Anticoncepción de emergencia (Levonorgestrel).
    SITUACIÓN: El interno propone un diagnóstico para Bridget Jones.
    
    DIAGNÓSTICO PROPUESTO: ${diagnosisId.toUpperCase()}.
    VERDADERO DIAGNÓSTICO: Toma masiva de Levonorgestrel (Agonista).
    
    SI ES CORRECTO (isCorrect=true):
    - "Exacto. Lo ha encontrado."
    - Explica pedagógicamente el principio de **SEÑUELO MOLECULAR**: El Levonorgestrel posee una estructura 3D casi idéntica a la Progesterona natural.
    - Usa la analogía de la LLAVE y la CERRADURA: "Es una llave falsa que entra perfectamente en la cerradura (el receptor) y la bloquea."
    - Consecuencia: El cuerpo es engañado, cree que hay muchísima progesterona, lo que bloquea la ovulación pero provoca estos efectos secundarios masivos.
    
    SI ES INCORRECTO:
    - Si el diagnóstico propuesto es "ULIPRISTAL" o "ETINILESTRADIOL": Búrlate de su visión espacial. "¿Ha mirado los modelos 3D con los ojos cerrados? El Ulipristal es enorme, eso no entra. El Etinilestradiol no tiene la cadena correcta. Era el Levonorgestrel, el único que se parece realmente a la Progesterona."
    - Si no (Apendicitis, etc.): Sarcasmo habitual sobre la ausencia de síntomas clave (sin fiebre, etc.).
    
    Formato: 2-3 párrafos. Tono sarcástico pero pedagógico.
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: isCorrect ? "Eres el Dr. Casa, orgulloso pero sarcástico." : "Eres el Dr. Casa, exasperado.",
        temperature: 0.9,
        maxOutputTokens: 1000,
      }
    }));
    return response.text || "Interesante... (Error de generación)";
  } catch (e) {
    console.error("House feedback error", e);
    return isCorrect ? "Bravo. Es eso. (Mensaje genérico tras error API)" : "No. Empiece de nuevo. (Mensaje genérico tras error API)";
  }
};