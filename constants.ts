import { RoomId, CharacterId, Room, Character, CaseData, MedicalExam, MedicalCondition } from './types';

// Liste des molécules pour l'analyse Libmol
export const PATHOGEN_LIST = [
  "Progesterona (Natural)",
  "Levonorgestrel (Progestágeno)",
  "Acetato de Ulipristal (Modulador)",
  "Etinilestradiol (Estrógeno)",
  "Testosterona"
].sort();

// Base de données détaillée pour l'aide à l'identification Moléculaire
export const PATHOGEN_DB: Record<string, { type: string; morphology: string; description: string }> = {
  "Progesterona (Natural)": {
    type: "Hormona endógena",
    morphology: "Estructura esteroidea clásica.",
    description: "Referencia."
  },
  "Levonorgestrel (Progestágeno)": {
    type: "Agonista sintético (Píldora del día después)",
    morphology: "Estructura muy similar a la progesterona.",
    description: "Es la molécula contenida en el NorLevo. Tomada en dosis altas, altera el ciclo."
  },
  "Acetato de Ulipristal": {
    type: "Modulador (EllaOne)",
    morphology: "Cadena lateral voluminosa.",
    description: "Otro tipo de anticoncepción de emergencia."
  },
  "Etinilestradiol (Estrógeno)": {
    type: "Estrógeno sintético",
    morphology: "Núcleo aromático (fenol).",
    description: "A menudo presente en las píldoras combinadas, pero no en la emergencia clásica."
  }
};

export const CASE_DATA: CaseData = {
  patientName: "Bridget Jones",
  age: 32,
  presentingSymptoms: "Náuseas violentas, dolores pélvicos, amnesia parcial de la noche anterior, ansiedad.",
  medicalTruth: `
    EL CASO MÉDICO (SECRETO): Sobredosis hormonal de Levonorgestrel (Píldora del día después) + Alcohol.
    
    DETALLES CLÍNICOS PARA LA IA:
    1.  **Contexto**: Noche muy regada con Chardonnay con Mark Darcy. Relación no protegida.
    2.  **El Olvido**: Bridget estaba borracha. Tomó una píldora del día después (Levonorgestrel) encontrada en su farmacia antes de desmayarse, pero NO lo recuerda.
    3.  **Síntomas**: Las náuseas se deben a la mezcla de alcohol + dosis masiva de hormonas. Los sangrados son un efecto secundario clásico (spotting) del Levonorgestrel.
    4.  **LA PISTA CRUCIAL (APARTAMENTO)**: El jugador DEBE encontrar el diario íntimo y el blíster vacío a través de la exploración textual. Una nota garabateada ilegiblemente prueba la toma: "Ups Mark... Tomé la píldora de emergencia... a dormir."
    5.  **Conclusión**: No es un embarazo, ni una apendicitis, es un efecto secundario del Levonorgestrel.
  `
};

export const SCIENTIFIC_GLOSSARY: Record<string, string> = {
  "progesterona": "Hormona sexual femenina de la gestación.",
  "levonorgestrel": "Progestágeno sintético utilizado en la anticoncepción de emergencia (Plan B, NorLevo).",
  "etinilestradiol": "Derivado sintético del estradiol, potente estrógeno.",
  "ulipristal": "Modulador de los receptores de la progesterona.",
  "agonista": "Molécula que activa el receptor (imita la hormona natural).",
  "amnesia": "Pérdida de memoria, aquí potencialmente debida a la intoxicación etílica.",
  "spotting": "Sangrados fuera de la regla, frecuente después de una anticoncepción de emergencia."
};

export const MEDICAL_MANUAL_ENTRIES: MedicalCondition[] = [
  {
    id: 'appendicite',
    name: 'Apendicitis Aguda',
    description: 'Inflamación del apéndice vermiforme.',
    symptoms: ['Dolor Fosa Ilíaca Derecha', 'Fiebre moderada', 'Defensa abdominal'],
    keyCriteria: { 
        hasFever: true, 
        hasBleeding: false, 
        isHcgPositive: false, 
        pathogen: ''
    }
  },
  {
    id: 'intoxication_ethylique',
    name: 'Intoxicación Etílica (Resaca)',
    description: 'Deshidratación sistémica e irritación gástrica aguda.',
    symptoms: ['Náuseas', 'Cefaleas', 'Amnesia lacunar', 'Temblores'],
    keyCriteria: { 
        hasFever: false, 
        hasBleeding: false, 
        isHcgPositive: false, 
        pathogen: '' 
    }
  },
  {
    id: 'gastro',
    name: 'Gastroenteritis Viral',
    description: 'Infección digestiva aguda.',
    symptoms: ['Diarrea', 'Vómitos', 'Fiebre', 'Calambres'],
    keyCriteria: { 
        hasFever: true, 
        hasBleeding: false, 
        isHcgPositive: false, 
        pathogen: '' 
    }
  },
  {
    id: 'kyste',
    name: 'Quiste Ovárico (Roto)',
    description: 'Ruptura de un quiste funcional u orgánico.',
    symptoms: ['Dolor brutal', 'Náuseas', 'Sin fiebre'],
    keyCriteria: { 
        hasFever: false, 
        hasBleeding: false, 
        isHcgPositive: false, 
        pathogen: '' 
    }
  },
  {
    id: 'geu',
    name: 'Embarazo Ectópico',
    description: 'Implantación ectópica del embrión.',
    symptoms: ['Retraso menstrual', 'Dolor lateral', 'Sangrados sepia', 'Beta-HCG Positivo'],
    keyCriteria: { 
        hasFever: false, 
        hasBleeding: true, 
        isHcgPositive: true, 
        pathogen: '' 
    }
  },
  {
    id: 'effet_ethinylestradiol',
    name: 'Toma de Etinilestradiol',
    description: 'Sobredosis de estrógeno sintético (Píldora combinada).',
    symptoms: ['Náuseas', 'Tensión mamaria', 'Cefaleas', 'Vértigos'],
    keyCriteria: { 
        hasFever: false, 
        hasBleeding: true, 
        isHcgPositive: false, 
        pathogen: 'Etinilestradiol (Estrógeno)' 
    }
  },
  {
    id: 'effet_ulipristal',
    name: 'Toma de Ulipristal (EllaOne)',
    description: 'Efectos secundarios de un modulador de los receptores de progesterona.',
    symptoms: ['Dolores abdominales', 'Retraso menstrual', 'Náuseas', 'Cefaleas'],
    keyCriteria: { 
        hasFever: false, 
        hasBleeding: true, 
        isHcgPositive: false, 
        pathogen: 'Acetato de Ulipristal (Modulador)' 
    }
  },
  {
    id: 'effet_levonorgestrel',
    name: 'Toma de Levonorgestrel (NorLevo)',
    description: 'Efectos secundarios de una dosis masiva de progestágeno sintético (Anticoncepción de emergencia).',
    symptoms: ['Náuseas', 'Vómitos', 'Spotting (Sangrados)', 'Dolores pélvicos'],
    keyCriteria: { 
        hasFever: false, 
        hasBleeding: true, 
        isHcgPositive: false, 
        pathogen: 'Levonorgestrel (Progestágeno)' // CIBLE DU JEU
    }
  }
];

export const CHARACTERS: Record<CharacterId, Character> = {
  [CharacterId.DR_CUDDY]: {
    id: CharacterId.DR_CUDDY,
    name: "Dra. Lisa Cuddy",
    specialty: "Decana / Administración",
    description: "Gestiona a la madre de Bridget por teléfono. Se niega a involucrarse en lo puramente médico.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/jpFxq7CZHEF2jgF/download",
    systemPrompt: `
      PERSONA: Dra. Lisa Cuddy.
      ROL: Decana del hospital.
      PROBLEMA: La madre de Bridget llama cada 5 minutos. Darcy está en pánico.
      ACTITUD: "Yo me ocupo de la familia y de lo administrativo. Ustedes, los médicos, encuentren qué tiene."
      PROHIBICIÓN ABSOLUTA: TÚ NO PRESCRIBES NINGÚN EXAMEN. No estás para eso. No sugieras nada médico.
      GESTIÓN: "Su madre quiere trasladarla a Londres. Encuentren una solución rápido antes de que yo explote."
    `
  },
  [CharacterId.DR_MAISON]: {
    id: CharacterId.DR_MAISON,
    name: "Dr. Gregory Casa",
    specialty: "Diagnosta",
    description: "Está convencido de que Bridget miente (o ha olvidado).",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/gG2pAjDNc4dCBgD/download",
    systemPrompt: `
      PERSONA: Dr. Gregory Casa (Dr. House).
      ACTITUD: "El paciente miente. O estaba tan borracha que olvidó. En ambos casos, su relato no vale nada."
      CONSEJO: "Vayan a registrar su apartamento. La gente esconde sus secretos bajo la almohada o en su diario íntimo."
      PISTA: Una vez encontrado el diario, NUNCA des la respuesta. Empuja al jugador a usar la herramienta de diagnóstico: "¿Creen haber encontrado? Pruébenlo validando el diagnóstico diferencial. No les creeré bajo palabra."
    `
  },
  [CharacterId.PATIENT]: {
    id: CharacterId.PATIENT,
    name: "Bridget Jones",
    description: "En pijama, tez cerosa. Tiene náuseas y sostiene una bolsa de hielo en su cabeza.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/ALst6mparZDr9kK/download", 
    systemPrompt: `
      PERSONA: Eres Bridget Jones.
      ESTADO: Resaca colosal + Dolores de vientre.
      MEMORIA: "Bebí demasiado Chardonnay con Mark. Nosotros... bueno... ya saben. Y esta mañana, me despierto en un charco de sangre con ganas de vomitar."
      NEGACIÓN: "¿Una píldora? ¡No! ¡No tomo nada! Solo quería dormir."
      CLAVE: Realmente has olvidado la toma del medicamento.
    `
  },
  [CharacterId.DR_NEURO]: {
    id: CharacterId.DR_NEURO,
    name: "Dr. Foreman",
    specialty: "Neurólogo",
    description: "Verifica si la amnesia es neurológica o etílica.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/TrAFD9YDY6EbGoc/download",
    systemPrompt: `
      PERSONA: Dr. Foreman.
      OPINIÓN: "La amnesia es típica de un 'blackout' alcohólico. Sin lesión cerebral."
    `
  },
  [CharacterId.DR_ENDO]: {
    id: CharacterId.DR_ENDO,
    name: "Dra. Allison Cameron",
    specialty: "Inmunóloga",
    description: "Busca una causa autoinmune a los dolores.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/mdAAH6xkgfXsgDi/download",
    systemPrompt: `
      PERSONA: Dra. Cameron.
      OPINIÓN: "¿Quizás una reacción alérgica? ¿O un estrés intenso?"
    `
  },
  [CharacterId.DR_GENETIC]: {
    id: CharacterId.DR_GENETIC,
    name: "Dr. Robert Chase",
    specialty: "Cirujano",
    description: "Listo para operar pero duda de la utilidad.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/a4rymD6Csa9fZFj/download",
    systemPrompt: `
      PERSONA: Dr. Chase.
      ACCIÓN: "La ecografía es normal. Sin quiste, sin apendicitis. Es químico, no quirúrgico."
    `
  },
  [CharacterId.PARTNER]: {
    id: CharacterId.PARTNER,
    name: "Mark Darcy",
    specialty: "Abogado",
    description: "Está a la cabecera de Bridget, preocupado y sosteniendo su bolso.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/kAXXTzynyYPWPAb/download", 
    systemPrompt: `
      PERSONA: Eres Mark Darcy.
      INFO: "Ella bebió mucho vino. Se levantó en la noche para ir al baño, la escuché buscar algo en su neceser. Dijo 'Por si acaso'. No sé qué era."
    `
  }
};

export const CHARACTER_SPECIFIC_QUESTIONS: Record<CharacterId, { label: string; text: string }[]> = {
  [CharacterId.DR_CUDDY]: [
    { label: "¿Caso del día?", text: "¿Cuál es el caso del día?" },
    { label: "¿Mamá?", text: "¿Qué dice la madre de Bridget?" },
    { label: "Traslado", text: "¿Podemos mantenerla aquí?" }
  ],
  [CharacterId.DR_MAISON]: [
    { label: "Hipótesis", text: "Si ella no miente, ¿qué es?" },
    { label: "Instrucción", text: "¿Qué debemos buscar en su casa?" }
  ],
  [CharacterId.PATIENT]: [
    { label: "Recuerdo", text: "¿Está segura de no haber tragado nada?" },
    { label: "Noche", text: "¿Qué pasó esta noche?" }
  ],
  [CharacterId.DR_ENDO]: [
    { label: "Ciclo", text: "¿Su ciclo es normal?" }
  ],
  [CharacterId.PARTNER]: [
    { label: "Baño", text: "¿Qué hizo ella en el baño?" },
    { label: "Alcohol", text: "¿Cuánto bebió?" }
  ],
  [CharacterId.DR_GENETIC]: [
    { label: "¿Operación?", text: "¿Hay que operar el apéndice?" },
    { label: "Dolor", text: "¿El dolor está localizado?" }
  ],
  [CharacterId.DR_NEURO]: [
    { label: "¿Cerebro?", text: "¿La amnesia es neurológica?" },
    { label: "Reflejos", text: "¿Sus reflejos son normales?" }
  ]
};

export const ROOMS: Record<RoomId, Room> = {
  [RoomId.RECEPTION]: {
    id: RoomId.RECEPTION,
    name: "Recepción",
    description: "Cuddy está al teléfono con la madre de Bridget.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/6YD8KMZdrZGWTz8/download",
    availableCharacters: [CharacterId.DR_CUDDY]
  },
  [RoomId.OFFICE_HOUSE]: {
    id: RoomId.OFFICE_HOUSE,
    name: "Despacho Dr. Casa",
    description: "Casa lanza su pelota contra la pared.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/SHbtyntmbPmTZ3t/download",
    availableCharacters: [CharacterId.DR_MAISON]
  },
  [RoomId.PATIENT_ROOM]: {
    id: RoomId.PATIENT_ROOM,
    name: "Habitación 104",
    description: "Bridget está acostada. Mark Darcy está sentado a su cabecera, consternado.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/JTaoQnCbmCH2XYW/download",
    availableCharacters: [CharacterId.PATIENT, CharacterId.PARTNER]
  },
  [RoomId.LAB]: {
    id: RoomId.LAB,
    name: "Laboratorio",
    description: "Análisis en curso.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/PKyQe9TzwkyczeM/download",
    availableCharacters: [CharacterId.DR_ENDO]
  },
  [RoomId.MEETING_ROOM]: {
    id: RoomId.MEETING_ROOM,
    name: "Sala de Diagnóstico",
    description: "Chase y Foreman debaten.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/CdjgRGDJFdT4Hbk/download",
    availableCharacters: [CharacterId.DR_GENETIC, CharacterId.DR_NEURO]
  },
  [RoomId.APARTMENT]: {
    id: RoomId.APARTMENT,
    name: "Apartamento de Bridget",
    description: "Escena del crimen... o de fiesta. Un desorden indescriptible.",
    imageUrl: "https://nuage02.apps.education.fr/index.php/s/eNYsPJn64GYpkAW/download", 
    availableCharacters: [] // Géré par l'interface d'exploration
  }
};

export const INITIAL_EXAMS: MedicalExam[] = [
  {
    id: 'anamnese',
    name: 'Interrogatorio (Anamnesis)',
    description: 'Discusión con Bridget.',
    result: 'Paciente confusa y con náuseas. "Bebí demasiado". Niega toda toma de medicamentos. No recuerda el final de la noche.',
    isUnlocked: true,
    type: 'PHYSICAL',
    cost: 0
  },
  {
    id: 'physical_exam',
    name: 'Examen Clínico',
    description: 'Examen general.',
    result: 'Tensión normal. Sin fiebre. Sensibilidad abdominal baja. Aliento etílico residual.',
    isUnlocked: false,
    type: 'PHYSICAL',
    cost: 50
  },
  {
    id: 'blood_hcg',
    name: 'Dosaje Beta-HCG (Sangre)',
    description: 'Prueba de embarazo cuantitativa.',
    result: 'NEGATIVO. Bridget no está embarazada.',
    isUnlocked: false,
    type: 'BLOOD',
    cost: 100,
    imageUrl: 'https://nuage02.apps.education.fr/index.php/s/SPyZbHTiaMpsR6W/download'
  },
  {
    id: 'ultrasound',
    name: 'Ecografía Pélvica',
    description: 'Visualización del útero y los ovarios.',
    result: 'Útero normal. Sin masa. Sin saco gestacional. Endometrio fino.',
    isUnlocked: false,
    type: 'IMAGING',
    cost: 300,
    imageUrl: 'https://nuage02.apps.education.fr/index.php/s/ZqLxE3bG4wopGwK/download'
  },
  {
    id: 'diary_clue',
    name: 'Búsqueda: Pista Diario',
    description: 'Elementos encontrados durante la exploración del apartamento.',
    result: 'PRUEBAS MATERIALES: 1 Blíster de aluminio vacío (sin nombre) encontrado en el baño. DIARIO ÍNTIMO (3h de la mañana): "Mierda... Olvidé protección... Tomé la cosa de emergencia... Espero que vaya bien con el vino."',
    isUnlocked: false,
    type: 'FIELD',
    cost: 150,
    imageUrl: 'https://nuage02.apps.education.fr/index.php/s/HyfFyZdwkqRPkCp/download'
  },
  {
    id: 'libmol_sim',
    name: 'Comparación Molecular (Libmol)',
    description: 'Comparar Levonorgestrel, Ulipristal y Etinilestradiol con la Progesterona.',
    result: 'Visualización 3D lista. Identifique qué molécula fue tomada (la más parecida a la progesterona).',
    isUnlocked: false,
    type: 'MOLECULAR',
    cost: 800,
    externalUrl: 'https://libmol.org/'
  }
];

// DATA POUR L'EXPLORATION DE L'APPARTEMENT
export const APARTMENT_SCENES = {
  HALL: {
    description: "Estás en la entrada. El apartamento es un desorden total. Huele a perfume barato y vino blanco.",
    options: [
      { id: 'LIVING', label: "Ir al Salón" },
      { id: 'KITCHEN', label: "Ir a la Cocina" },
      { id: 'BATH', label: "Ir al Baño" },
      { id: 'BEDROOM', label: "Ir a la Habitación" }
    ]
  },
  LIVING: {
    description: "El salón está lleno de confeti. En el sofá, está el famoso jersey feo de Navidad de Darcy. Tres botellas de Chardonnay vacías ruedan por el suelo. Vasos medio llenos están sobre la mesa baja.",
    options: [
      { id: 'HALL', label: "Volver a la entrada" }
    ]
  },
  KITCHEN: {
    description: "El fregadero se desborda. Hay una sopa azul extraña congelada en una cacerola (¿la famosa sopa de hilo?). Muchos corchos sobre la encimera.",
    options: [
      { id: 'HALL', label: "Volver a la entrada" }
    ]
  },
  BATH: {
    description: "El baño es un campo de batalla cosmético. Buscando bien cerca del lavabo, encuentras un BLÍSTER DE ALUMINIO VACÍO. Ninguna inscripción, sin caja. Solo alvéolos vacíos.",
    options: [
      { id: 'HALL', label: "Volver a la entrada" }
    ]
  },
  BEDROOM: {
    description: "La cama está deshecha. En la mesita de noche, bajo una caja de chocolates, hay un cuaderno rojo.",
    options: [
      { id: 'READ_DIARY', label: "Leer el Diario Íntimo", action: true },
      { id: 'HALL', label: "Volver a la entrada" }
    ]
  }
};