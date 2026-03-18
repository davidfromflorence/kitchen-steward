import {
  Leaf,
  Refrigerator,
  Users,
  MessageCircle,
  ChefHat,
  TrendingDown,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Check,
  Repeat,
  Smartphone,
  Plus,
  UtensilsCrossed,
  Bell,
  BarChart3,
} from 'lucide-react'
import SavingsCalculator from './savings-calculator'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-5 md:px-16 py-4 max-w-7xl mx-auto">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-olive-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Kitchen Steward</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#come-funziona" className="hover:text-slate-900 transition-colors">Come funziona</a>
          <a href="#funzionalita" className="hover:text-slate-900 transition-colors">Funzionalità</a>
          <a href="#risparmia" className="hover:text-slate-900 transition-colors">Quanto risparmi</a>
        </div>
        <a
          href="/login"
          className="bg-olive-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-olive-700 active:scale-95 transition-all"
        >
          Inizia gratis
        </a>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="max-w-7xl mx-auto px-5 md:px-16 pt-16 md:pt-24 pb-10 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-olive-100 text-olive-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Alimentato da intelligenza artificiale
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-slate-900">
            Zero Waste,
            <br />
            <span className="bg-gradient-to-r from-olive-600 to-emerald-500 bg-clip-text text-transparent italic font-light">
              Max Taste
            </span>
          </h1>
          <p className="mt-6 text-slate-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Kitchen Steward gestisce il tuo frigo con l&apos;AI. Sai cosa hai, cosa scade, cosa cucinare e cosa comprare. <strong className="text-slate-700">Tutto via WhatsApp.</strong>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/login"
              className="w-full sm:w-auto bg-olive-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-olive-700 active:scale-95 transition-all text-base inline-flex items-center justify-center gap-2"
            >
              Inizia gratis <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#come-funziona"
              className="w-full sm:w-auto border border-slate-300 text-slate-700 font-semibold px-8 py-4 rounded-xl hover:bg-white transition-all text-base inline-flex items-center justify-center gap-2"
            >
              Scopri come funziona
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-400">Gratis per sempre. Nessuna carta richiesta.</p>
        </div>

        {/* Hero: WA mockup + Fridge illustration side by side */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          {/* WhatsApp mockup */}
          <div className="bg-[#ECE5DD] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-olive-400 rounded-full flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Kitchen Steward</p>
                <p className="text-emerald-200 text-[10px]">online</p>
              </div>
            </div>
            <div className="px-3 py-4 space-y-2">
              <div className="flex justify-end">
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                  <p className="text-sm text-slate-800">Cosa cucino stasera?</p>
                  <p className="text-[10px] text-slate-500 text-right mt-0.5">13:42</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] shadow-sm">
                  <p className="text-sm text-slate-800">
                    🍽️ Ecco 3 idee dal tuo frigo:
                  </p>
                  <p className="text-sm text-slate-800 mt-1">
                    1️⃣ <strong>Pasta al pesto</strong> — 15 min<br />
                    2️⃣ <strong>Frittata di verdure</strong> — 10 min<br />
                    3️⃣ <strong>Bruschette</strong> — 5 min
                  </p>
                  <p className="text-[10px] text-slate-500 text-right mt-1">13:42</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2">
                  <p className="text-sm text-slate-800">2</p>
                  <p className="text-[10px] text-slate-500 text-right mt-0.5">13:43</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] shadow-sm">
                  <p className="text-sm text-slate-800">
                    🥬 <strong>Frittata di verdure</strong><br />
                    ⏱️ 10 min · 👥 2 persone<br /><br />
                    Usa le zucchine che scadono domani! ♻️
                  </p>
                  <p className="text-[10px] text-slate-500 text-right mt-1">13:43</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fridge illustration */}
          <div className="hidden md:flex flex-col items-center gap-4">
            <div className="relative">
              {/* Stylized fridge */}
              <div className="w-48 h-72 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 shadow-lg relative overflow-hidden">
                {/* Fridge top */}
                <div className="h-[35%] border-b-2 border-slate-300 p-3 flex flex-wrap gap-1.5 content-start">
                  <div className="w-8 h-8 bg-yellow-200 rounded-lg" title="Formaggio" />
                  <div className="w-8 h-8 bg-white rounded-lg border border-slate-200" title="Latte" />
                  <div className="w-8 h-8 bg-red-200 rounded-lg" title="Pomodori" />
                  <div className="w-6 h-6 bg-amber-100 rounded-full" title="Uova" />
                  <div className="w-6 h-6 bg-amber-100 rounded-full" />
                </div>
                {/* Fridge bottom */}
                <div className="p-3 flex flex-wrap gap-1.5 content-start">
                  <div className="w-10 h-6 bg-green-200 rounded-lg" title="Zucchine" />
                  <div className="w-10 h-6 bg-orange-200 rounded-lg" title="Carote" />
                  <div className="w-8 h-8 bg-pink-100 rounded-lg" title="Prosciutto" />
                  <div className="w-12 h-5 bg-amber-300 rounded-lg" title="Pasta" />
                  <div className="w-8 h-8 bg-emerald-200 rounded-lg" title="Insalata" />
                  <div className="w-10 h-6 bg-sky-100 rounded-lg" title="Yogurt" />
                  <div className="w-8 h-5 bg-red-100 rounded-lg" title="Mozzarella" />
                </div>
                {/* Handle */}
                <div className="absolute right-2 top-[38%] w-1.5 h-8 bg-slate-400 rounded-full" />
              </div>

              {/* Floating badges around fridge */}
              <div className="absolute -top-3 -right-16 bg-white rounded-xl shadow-lg px-3 py-2 border border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold">SCADENZE</p>
                <p className="text-sm font-bold text-amber-600">3 prodotti</p>
              </div>
              <div className="absolute -bottom-3 -left-20 bg-white rounded-xl shadow-lg px-3 py-2 border border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold">ZERO SPRECO</p>
                <p className="text-sm font-bold text-emerald-600">94%</p>
              </div>
              <div className="absolute top-1/2 -right-20 bg-olive-600 text-white rounded-xl shadow-lg px-3 py-2">
                <p className="text-[10px] font-bold">RISPARMIATO</p>
                <p className="text-sm font-bold">€142/mese</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COME FUNZIONA ═══ */}
      <section id="come-funziona" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-olive-600">Semplice come una chat</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold text-slate-900">
              Come funziona
            </h2>
          </div>

          {/* Steps with app screenshots */}
          <div className="space-y-16 md:space-y-24">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-olive-100 text-olive-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Passo 1
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  Aggiungi cosa hai comprato
                </h3>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Scrivi su WhatsApp <em>&ldquo;Ho comprato pollo, uova e latte&rdquo;</em> oppure usa l&apos;app. L&apos;AI riconosce tutto, assegna le scadenze e organizza per zone: frigo, freezer, dispensa.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Scadenze calcolate automaticamente per prodotto
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Drag & drop tra frigo, freezer e dispensa
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Condiviso con tutta la famiglia
                  </div>
                </div>
              </div>
              {/* App screenshot placeholder — fridge view */}
              <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 shadow-inner">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-slate-800">Il mio frigo</p>
                    <div className="flex gap-1.5">
                      <div className="bg-olive-600 text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-2.5 h-2.5" /> Aggiungi</div>
                      <div className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"><UtensilsCrossed className="w-2.5 h-2.5" /> Mangiato</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { emoji: '🥛', name: 'Latte', exp: '5g', color: 'border-slate-200' },
                      { emoji: '🥬', name: 'Zucchine', exp: '2g', color: 'border-amber-300' },
                      { emoji: '🥩', name: 'Pollo', exp: '1g', color: 'border-red-300' },
                      { emoji: '🧀', name: 'Mozzarella', exp: '3g', color: 'border-amber-300' },
                      { emoji: '🥚', name: 'Uova', exp: '14g', color: 'border-slate-200' },
                      { emoji: '🍞', name: 'Pane', exp: '2g', color: 'border-amber-300' },
                    ].map((i) => (
                      <div key={i.name} className={`bg-slate-50 rounded-lg p-2 text-center border ${i.color}`}>
                        <span className="text-xl">{i.emoji}</span>
                        <p className="text-[10px] font-semibold text-slate-700 mt-0.5">{i.name}</p>
                        <p className="text-[9px] text-slate-400">{i.exp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 bg-olive-100 text-olive-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Passo 2
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  Cucina senza sprechi
                </h3>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Chiedi <em>&ldquo;Cosa cucino stasera?&rdquo;</em> e ricevi 3 ricette che usano gli ingredienti in scadenza. Dì cosa hai mangiato e il frigo si aggiorna da solo.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    3 ricette tra cui scegliere, ogni volta diverse
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Priorità a ingredienti che scadono prima
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Meal planning settimanale con spesa automatica
                  </div>
                </div>
              </div>
              {/* Recipe cards mockup */}
              <div className="md:order-1 bg-slate-100 rounded-2xl border border-slate-200 p-4 shadow-inner">
                <div className="space-y-2">
                  {[
                    { emoji: '🍝', title: 'Pasta al pesto', time: '15 min', color: 'from-olive-300 to-emerald-500', reason: 'Usa il pesto che scade domani' },
                    { emoji: '🥘', title: 'Frittata di verdure', time: '10 min', color: 'from-amber-300 to-orange-500', reason: 'Salva zucchine e uova' },
                    { emoji: '🥗', title: 'Insalata ricca', time: '5 min', color: 'from-sky-300 to-blue-500', reason: 'Perfetta per il radicchio' },
                  ].map((r) => (
                    <div key={r.title} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className={`h-10 bg-gradient-to-r ${r.color} flex items-center px-3`}>
                        <p className="text-white text-sm font-bold">{r.emoji} {r.title}</p>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <p className="text-[10px] text-olive-600 font-medium">♻️ {r.reason}</p>
                        <p className="text-[10px] text-slate-400">{r.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-olive-100 text-olive-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Passo 3
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  Risparmia e monitora
                </h3>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Ogni settimana ricevi un report con quanto hai risparmiato, quanta CO₂ hai evitato e un punteggio anti-spreco. Abitudini ricorrenti? Il frigo si aggiorna da solo ogni mattina.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Report settimanale su WhatsApp
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Abitudini automatiche (caffè, biscotti...)
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-olive-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-olive-600" /></div>
                    Lista della spesa auto-generata per Google Keep
                  </div>
                </div>
              </div>
              {/* Weekly report mockup */}
              <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 shadow-inner">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Report settimanale</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-olive-50 flex items-center justify-center mx-auto mb-1">
                        <Leaf className="w-5 h-5 text-olive-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">4.2kg</p>
                      <p className="text-[9px] text-slate-400">Cibo salvato</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center mx-auto mb-1">
                        <TrendingDown className="w-5 h-5 text-sky-500" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">12kg</p>
                      <p className="text-[9px] text-slate-400">CO₂ evitata</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-1">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">€38</p>
                      <p className="text-[9px] text-slate-400">Risparmiati</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-amber-400">★★★★★</span>
                    <span className="text-xs font-bold text-slate-600 ml-1">Zero sprechi!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FUNZIONALITÀ ═══ */}
      <section id="funzionalita" className="py-20 md:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-olive-600">Tutto incluso</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold text-slate-900">
              Un assistente completo
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Tutto ciò che ti serve per gestire la cucina, nel tuo WhatsApp
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Refrigerator, title: 'Frigo smart', desc: 'Inventario con zone (frigo, freezer, dispensa). Scadenze calcolate per ogni prodotto. Drag & drop tra zone.' },
              { icon: MessageCircle, title: 'Chat WhatsApp', desc: 'Parla naturale: "Cosa c\'è nel frigo?", "Ho mangiato pasta al pesto". Il bot capisce e aggiorna.' },
              { icon: ChefHat, title: 'Ricette AI', desc: '3 proposte basate su ciò che hai, con priorità a cosa scade. Filtri per tempo, porzioni, dieta.' },
              { icon: ShoppingCart, title: 'Lista della spesa', desc: 'Generata automaticamente. Formato con checkbox per Google Keep e Apple Notes.' },
              { icon: Users, title: 'Famiglia condivisa', desc: 'Un frigo per tutti. Link di invito. Notifiche quando qualcuno aggiunge o consuma prodotti.' },
              { icon: Repeat, title: 'Abitudini', desc: '"Caffè e biscotti ogni mattina" — il frigo si aggiorna automaticamente. Con conferma WhatsApp.' },
              { icon: Bell, title: 'Alert scadenze', desc: 'Notifica giornaliera su WhatsApp con prodotti in scadenza e suggerimento ricetta per usarli.' },
              { icon: Smartphone, title: 'Meal planning', desc: 'Pianifica pranzi e cene della settimana. La lista della spesa si genera da sola.' },
              { icon: Sparkles, title: 'Zero effort', desc: 'Niente codici a barre, niente foto obbligatorie. Scrivi cosa hai comprato e basta.' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md hover:border-olive-200 transition-all group">
                <div className="w-10 h-10 bg-olive-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-olive-100 transition-colors">
                  <f.icon className="w-5 h-5 text-olive-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SAVINGS CALCULATOR ═══ */}
      <section id="risparmia" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-olive-600">Calcola il tuo risparmio</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold text-slate-900">
              Quanto spreco puoi evitare?
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Rispondi a 3 domande e scopri quanto puoi risparmiare ogni anno
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <SavingsCalculator />
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Chi lo usa, lo ama</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { quote: 'Da quando uso Kitchen Steward non butto più niente. Il report settimanale mi motiva tantissimo.', name: 'Laura M.', role: 'Mamma di 3' },
              { quote: 'La chat WhatsApp è geniale. Scrivo cosa ho comprato e il frigo si aggiorna. Zero fatica.', name: 'Marco T.', role: 'Chef amatoriale' },
              { quote: 'Finalmente tutta la famiglia sa cosa c\'è nel frigo. Niente più doppioni al supermercato.', name: 'Giulia R.', role: 'Studentessa' },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center text-xs font-bold text-olive-600">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="bg-olive-600 rounded-3xl py-16 md:py-20 px-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight relative">
              Zero Waste,
              <br />
              <span className="italic font-light text-olive-100">Max Taste</span>
            </h2>
            <p className="mt-6 text-olive-100 max-w-md mx-auto relative">
              Unisciti alle famiglie che risparmiano tempo, soldi e cibo ogni giorno.
            </p>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 mt-8 bg-white text-olive-700 font-semibold px-8 py-4 rounded-xl hover:bg-olive-50 active:scale-95 transition-all text-base relative"
            >
              Crea il tuo account gratis <ArrowRight className="w-4 h-4" />
            </a>
            <div className="mt-6 flex items-center justify-center gap-6 text-olive-200 text-xs relative flex-wrap">
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Gratis per sempre</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> WhatsApp incluso</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Nessuna carta</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-olive-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Kitchen Steward</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Termini</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Contatti</a>
            </div>
            <p className="text-xs text-slate-400">&copy; 2026 Kitchen Steward. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Kitchen Steward',
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'Web',
            description: 'Gestisci il frigo con l\'AI, riduci gli sprechi alimentari, risparmia sulla spesa. Chat WhatsApp integrata.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          }),
        }}
      />
    </div>
  )
}
