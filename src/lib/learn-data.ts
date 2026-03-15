/* ── Learn & Gamification Data ─────────────────────────── */

export interface FoodFact {
  id: number
  chip: string
  fact: string
  emoji: string
}

export interface Flashcard {
  id: number
  question: string
  answer: string
  emoji: string
  category: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  emoji: string
}

/* ── Food Facts ───────────────────────────────────────── */

export const FOOD_FACTS: FoodFact[] = [
  { id: 1, chip: 'Banane & Mele', emoji: '🍌', fact: 'Le mele rilasciano etilene che fa maturare le banane 2x più velocemente. Conservale separate!' },
  { id: 2, chip: '1/3 del cibo', emoji: '🌍', fact: 'Ogni anno si spreca 1/3 di tutto il cibo prodotto al mondo: 1.3 miliardi di tonnellate.' },
  { id: 3, chip: 'Acqua nascosta', emoji: '💧', fact: 'Buttare 1 kg di manzo equivale a sprecare 15.000 litri d\'acqua usati per produrlo.' },
  { id: 4, chip: 'Frigorifero', emoji: '❄️', fact: 'La temperatura ideale del frigo è 1-4°C. Ogni grado in più riduce la shelf life del 50%.' },
  { id: 5, chip: 'Pane raffermo', emoji: '🍞', fact: 'Il pane raffermo si rigenera in forno a 180°C per 5 minuti avvolto in alluminio.' },
  { id: 6, chip: 'Metano', emoji: '♻️', fact: 'Il cibo in discarica produce metano, un gas serra 80x più potente della CO2.' },
  { id: 7, chip: 'Congelamento', emoji: '🧊', fact: 'Quasi tutti gli alimenti possono essere congelati. Il latte dura fino a 3 mesi in freezer.' },
  { id: 8, chip: 'Erbe fresche', emoji: '🌿', fact: 'Metti le erbe aromatiche in un bicchiere d\'acqua in frigo: durano fino a 2 settimane.' },
  { id: 9, chip: 'Spreco in Italia', emoji: '🇮🇹', fact: 'In Italia ogni persona spreca circa 65 kg di cibo all\'anno, per un valore di €250.' },
  { id: 10, chip: 'Scadenza vs TMC', emoji: '📅', fact: '"Da consumarsi preferibilmente entro" non significa scaduto! Molti cibi sono ancora buoni.' },
  { id: 11, chip: 'Avanzi creativi', emoji: '👨‍🍳', fact: 'Le migliori ricette della tradizione (ribollita, panzanella) nascono dal riuso degli avanzi.' },
  { id: 12, chip: 'Pomodori', emoji: '🍅', fact: 'Non mettere i pomodori in frigo! Perdono sapore e consistenza. Meglio a temperatura ambiente.' },
  { id: 13, chip: 'Food sharing', emoji: '🤝', fact: 'Le app di food sharing hanno salvato oltre 200 milioni di pasti dallo spreco nel 2024.' },
  { id: 14, chip: 'Patate & cipolle', emoji: '🥔', fact: 'Patate e cipolle insieme germogliano più velocemente. Conservale in posti separati e bui.' },
  { id: 15, chip: 'Compostaggio', emoji: '🌱', fact: 'Compostare i rifiuti organici riduce i rifiuti in discarica del 30% e crea fertilizzante gratis.' },
  { id: 16, chip: 'Riso avanzato', emoji: '🍚', fact: 'Il riso avanzato va refrigerato entro 1 ora. Riscaldalo a 70°C+ per eliminare i batteri.' },
  { id: 17, chip: 'Foglie di carota', emoji: '🥕', fact: 'Le foglie di carota sono commestibili e ricche di vitamina K. Perfette per pesto e insalate.' },
  { id: 18, chip: 'Plastica & cibo', emoji: '🔬', fact: 'Ogni settimana ingeriamo circa 5g di microplastiche — quanto una carta di credito.' },
  { id: 19, chip: 'Caffè', emoji: '☕', fact: 'I fondi di caffè sono un ottimo fertilizzante per piante acidofile come azalee e mirtilli.' },
  { id: 20, chip: 'FIFO', emoji: '📦', fact: 'Usa il metodo FIFO (First In, First Out): metti i cibi nuovi dietro quelli vecchi in frigo.' },
]

/* ── Flashcards ───────────────────────────────────────── */

export const FLASHCARDS: Flashcard[] = [
  { id: 1, question: 'Quanto dura il pollo crudo in frigo?', answer: '1-2 giorni massimo a 4°C. Nel freezer fino a 9 mesi.', emoji: '🍗', category: 'Conservazione' },
  { id: 2, question: 'Si possono congelare le uova?', answer: 'Sì! Sgusciale, sbattile e congelale in contenitori. Durano fino a 12 mesi.', emoji: '🥚', category: 'Conservazione' },
  { id: 3, question: 'Come capire se un uovo è fresco?', answer: 'Immergilo in acqua: se affonda è fresco, se galleggia è vecchio (ma non necessariamente cattivo).', emoji: '🥚', category: 'Trucchi' },
  { id: 4, question: 'Qual è il cibo più sprecato al mondo?', answer: 'Il pane. In Europa il 30% del pane prodotto finisce nella spazzatura.', emoji: '🍞', category: 'Sprechi' },
  { id: 5, question: 'Come conservare il basilico fresco?', answer: 'Come un bouquet: steli in acqua, a temperatura ambiente, lontano dalla luce diretta. Non in frigo!', emoji: '🌿', category: 'Trucchi' },
  { id: 6, question: 'Il miele scade?', answer: 'No! Il miele non scade mai. Se cristallizza, basta scaldarlo a bagnomaria.', emoji: '🍯', category: 'Conservazione' },
  { id: 7, question: 'Quanta CO2 produce lo spreco alimentare?', answer: 'L\'8-10% delle emissioni globali di gas serra. Se fosse un Paese, sarebbe il 3° più inquinante.', emoji: '🏭', category: 'Ambiente' },
  { id: 8, question: 'Come far durare di più le fragole?', answer: 'Lavale con una soluzione di acqua e aceto (3:1), asciugale bene e conserva in frigo su carta assorbente.', emoji: '🍓', category: 'Trucchi' },
  { id: 9, question: 'Cosa significa "shelf life"?', answer: 'Il periodo in cui un alimento mantiene qualità e sicurezza nelle condizioni di conservazione indicate.', emoji: '📚', category: 'Definizioni' },
  { id: 10, question: 'Quanto cibo basta per sfamare chi ha fame nel mondo?', answer: 'Lo spreco alimentare globale (1.3 mld tonnellate/anno) basterebbe a sfamare 2 miliardi di persone.', emoji: '🌎', category: 'Sprechi' },
  { id: 11, question: 'Come congelare correttamente?', answer: 'Porziona, elimina l\'aria dal sacchetto, etichetta con data e contenuto. Congela piatto per risparmiare spazio.', emoji: '🧊', category: 'Conservazione' },
  { id: 12, question: 'Perché non ricongelare un cibo scongelato?', answer: 'I batteri si moltiplicano durante lo scongelamento. Ricongelare può portare a livelli pericolosi di contaminazione.', emoji: '⚠️', category: 'Sicurezza' },
]

/* ── Quiz Questions ───────────────────────────────────── */

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Qual è la temperatura ideale del frigorifero?',
    options: ['0°C', '1-4°C', '5-8°C', '10°C'],
    correctIndex: 1,
    explanation: 'La temperatura ideale è tra 1 e 4°C. Ogni grado in più dimezza la durata di conservazione degli alimenti.',
    emoji: '❄️',
  },
  {
    id: 2,
    question: 'Quanto cibo viene sprecato ogni anno nel mondo?',
    options: ['1/10 della produzione', '1/5 della produzione', '1/3 della produzione', '1/2 della produzione'],
    correctIndex: 2,
    explanation: 'Circa 1/3 di tutto il cibo prodotto (1.3 miliardi di tonnellate) viene sprecato ogni anno.',
    emoji: '🌍',
  },
  {
    id: 3,
    question: 'Cosa significa la sigla TMC su un\'etichetta alimentare?',
    options: ['Temperatura Massima Consentita', 'Termine Minimo di Conservazione', 'Test di Maturazione Certificato', 'Trattamento Microbiologico Controllato'],
    correctIndex: 1,
    explanation: 'TMC indica il "Termine Minimo di Conservazione". Dopo quella data il cibo può perdere qualità ma spesso è ancora sicuro.',
    emoji: '📅',
  },
  {
    id: 4,
    question: 'Perché non bisogna conservare patate e cipolle insieme?',
    options: ['Cambiano colore', 'Germogliano più velocemente', 'Diventano amare', 'Producono muffe'],
    correctIndex: 1,
    explanation: 'Le cipolle rilasciano gas che accelerano la germogliazione delle patate. Meglio conservarle in posti separati e bui.',
    emoji: '🥔',
  },
  {
    id: 5,
    question: 'Entro quanto tempo va refrigerato il riso avanzato?',
    options: ['Entro 3 ore', 'Entro 1 ora', 'Entro 30 minuti', 'Il giorno dopo va bene'],
    correctIndex: 1,
    explanation: 'Il riso avanzato va refrigerato entro 1 ora dalla cottura per evitare la proliferazione del Bacillus cereus.',
    emoji: '🍚',
  },
  {
    id: 6,
    question: 'Quanto metano in più produce il cibo in discarica rispetto alla CO2?',
    options: ['10 volte', '25 volte', '80 volte', '150 volte'],
    correctIndex: 2,
    explanation: 'Il metano prodotto dalla decomposizione del cibo in discarica è un gas serra 80 volte più potente della CO2.',
    emoji: '♻️',
  },
  {
    id: 7,
    question: 'Qual è il cibo più sprecato in Europa?',
    options: ['La frutta', 'La carne', 'Il pane', 'La verdura'],
    correctIndex: 2,
    explanation: 'Il pane è il cibo più sprecato in Europa: circa il 30% del pane prodotto finisce nella spazzatura.',
    emoji: '🍞',
  },
  {
    id: 8,
    question: 'Quanta acqua serve per produrre 1 kg di manzo?',
    options: ['1.000 litri', '5.000 litri', '15.000 litri', '50.000 litri'],
    correctIndex: 2,
    explanation: 'Servono circa 15.000 litri d\'acqua per produrre 1 kg di carne bovina, considerando mangimi, abbeveraggio e lavorazione.',
    emoji: '💧',
  },
  {
    id: 9,
    question: 'Cosa significa il metodo FIFO in cucina?',
    options: ['Fast In, Fast Out', 'First In, First Out', 'Fresh Is For Ordering', 'Freeze It For Others'],
    correctIndex: 1,
    explanation: 'FIFO significa "First In, First Out": i cibi acquistati prima vanno consumati prima. Metti i nuovi dietro ai vecchi.',
    emoji: '📦',
  },
  {
    id: 10,
    question: 'Quanto spreca in media un italiano in cibo ogni anno?',
    options: ['25 kg (~€100)', '45 kg (~€150)', '65 kg (~€250)', '90 kg (~€400)'],
    correctIndex: 2,
    explanation: 'In Italia ogni persona spreca circa 65 kg di cibo all\'anno, per un valore economico di circa €250.',
    emoji: '🇮🇹',
  },
]
