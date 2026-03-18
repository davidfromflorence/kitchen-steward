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
} from 'lucide-react'

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
          <a href="#impatto" className="hover:text-slate-900 transition-colors">Impatto</a>
        </div>
        <a
          href="/login"
          className="bg-olive-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-olive-700 active:scale-95 transition-all"
        >
          Inizia gratis
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-16 pt-16 md:pt-24 pb-20 md:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-olive-100 text-olive-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Alimentato da intelligenza artificiale
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-slate-900">
            Il tuo frigo,
            <br />
            <span className="bg-gradient-to-r from-olive-600 to-emerald-500 bg-clip-text text-transparent">
              zero sprechi
            </span>
          </h1>
          <p className="mt-6 text-slate-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Kitchen Steward gestisce il tuo frigo con l&apos;AI. Sai cosa hai, cosa scade, cosa cucinare e cosa comprare. Tutto via WhatsApp o dall&apos;app.
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

        {/* Hero visual — WhatsApp chat mockup */}
        <div className="mt-16 max-w-sm mx-auto">
          <div className="bg-[#ECE5DD] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* WA header */}
            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-olive-400 rounded-full flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Kitchen Steward</p>
                <p className="text-emerald-200 text-[10px]">online</p>
              </div>
            </div>
            {/* Messages */}
            <div className="px-3 py-4 space-y-2">
              <div className="flex justify-end">
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                  <p className="text-sm text-slate-800">Cosa cucino stasera? 🍝</p>
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
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Come funziona
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Tre passi per un frigo senza sprechi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-olive-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-bold text-olive-600">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aggiungi al frigo</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Scrivi su WhatsApp cosa hai comprato, o usa l&apos;app. L&apos;AI riconosce i prodotti e calcola le scadenze.
              </p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-olive-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-bold text-olive-600">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cucina senza sprechi</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Chiedi una ricetta e l&apos;AI ti propone piatti con gli ingredienti che scadono prima. Dì cosa hai mangiato e il frigo si aggiorna.
              </p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-olive-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-bold text-olive-600">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Risparmia e condividi</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Report settimanale con risparmi e CO₂ evitata. Condividi il frigo con tutta la famiglia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funzionalità */}
      <section id="funzionalita" className="py-20 md:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Tutto ciò che ti serve
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Un assistente di cucina completo, nel tuo WhatsApp
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Refrigerator, title: 'Frigo smart', desc: 'Inventario in tempo reale con zone (frigo, freezer, dispensa) e scadenze automatiche per ogni prodotto.' },
              { icon: MessageCircle, title: 'Chat WhatsApp', desc: '"Cosa c\'è nel frigo?" "Ho mangiato pasta al pesto" — parla naturale, il bot capisce e aggiorna.' },
              { icon: ChefHat, title: 'Ricette AI', desc: '3 proposte basate su ciò che hai, con priorità a cosa scade. Scegli e cucina.' },
              { icon: ShoppingCart, title: 'Lista della spesa', desc: 'Generata automaticamente da ciò che manca. Formato Google Keep con checkbox.' },
              { icon: Users, title: 'Condivisione famiglia', desc: 'Un frigo per tutta la famiglia. Notifiche quando qualcuno aggiunge o consuma prodotti.' },
              { icon: Repeat, title: 'Abitudini', desc: '"Ogni mattina caffè e biscotti" — il frigo si aggiorna automaticamente ogni giorno.' },
              { icon: TrendingDown, title: 'Meno sprechi', desc: 'Alert scadenze, suggerimenti anti-spreco, report settimanale con soldi risparmiati e CO₂ evitata.' },
              { icon: Smartphone, title: 'Meal planning', desc: 'Pianifica pranzi e cene della settimana. La spesa si genera da sola.' },
              { icon: Sparkles, title: 'Zero effort', desc: 'Niente codici a barre, niente foto obbligatorie. Scrivi cosa hai comprato e basta.' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md hover:border-olive-200 transition-all">
                <div className="w-10 h-10 bg-olive-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-olive-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impatto */}
      <section id="impatto" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Il tuo impatto conta
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Ogni famiglia che riduce lo spreco fa la differenza
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-olive-50 to-emerald-50 rounded-2xl p-8 border border-olive-200/50 text-center">
              <p className="text-5xl md:text-6xl font-bold text-slate-900">35%</p>
              <p className="text-sm text-slate-500 mt-2">Riduzione media dello spreco alimentare in 3 mesi</p>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-8 border border-sky-200/50 text-center">
              <p className="text-5xl md:text-6xl font-bold text-slate-900">€1.200</p>
              <p className="text-sm text-slate-500 mt-2">Risparmio annuo medio per famiglia sulla spesa</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200/50 text-center">
              <p className="text-5xl md:text-6xl font-bold text-slate-900">140kg</p>
              <p className="text-sm text-slate-500 mt-2">CO₂ risparmiata all&apos;anno per famiglia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { quote: 'Da quando uso Kitchen Steward non butto più niente. Il report settimanale mi motiva tantissimo.', name: 'Laura M.', role: 'Mamma di 3' },
              { quote: 'La chat WhatsApp è geniale. Scrivo cosa ho comprato e il frigo si aggiorna. Zero fatica.', name: 'Marco T.', role: 'Chef amatoriale' },
              { quote: 'Finalmente tutta la famiglia sa cosa c\'è nel frigo. Niente più doppioni al supermercato.', name: 'Giulia R.', role: 'Studentessa' },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex gap-1 mb-3">
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

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="bg-olive-600 rounded-3xl py-16 md:py-20 px-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight relative">
              Pronto a non sprecare
              <br />
              più niente?
            </h2>
            <p className="mt-6 text-olive-100 max-w-md mx-auto relative">
              Unisciti alle famiglie che risparmiano tempo, soldi e cibo ogni giorno.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <a
                href="/login"
                className="w-full sm:w-auto bg-white text-olive-700 font-semibold px-8 py-4 rounded-xl hover:bg-olive-50 active:scale-95 transition-all text-base inline-flex items-center justify-center gap-2"
              >
                Crea il tuo account gratis <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-olive-200 text-xs relative">
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Gratis per sempre</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> WhatsApp incluso</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Nessuna carta</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
            <p className="text-xs text-slate-400">
              &copy; 2026 Kitchen Steward. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>

      {/* JSON-LD structured data for SEO */}
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
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
          }),
        }}
      />
    </div>
  )
}
