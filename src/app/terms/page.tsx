import { Leaf } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="flex items-center justify-between px-5 md:px-16 py-4 max-w-4xl mx-auto">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-olive-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Kitchen Steward</span>
        </a>
      </nav>

      <main className="max-w-4xl mx-auto px-5 md:px-16 py-8 pb-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Termini di Servizio</h1>
        <p className="text-sm text-slate-400 mb-8">Ultimo aggiornamento: 21 marzo 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">1. Accettazione dei termini</h2>
            <p>
              Utilizzando Kitchen Steward, accetti i presenti Termini di Servizio.
              Se non sei d&apos;accordo con questi termini, ti preghiamo di non utilizzare il servizio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">2. Descrizione del servizio</h2>
            <p>
              Kitchen Steward è un&apos;applicazione web che aiuta gli utenti a gestire il proprio
              inventario alimentare domestico, ridurre gli sprechi e pianificare i pasti tramite
              intelligenza artificiale. Il servizio include:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Gestione dell&apos;inventario del frigo, freezer e dispensa</li>
              <li>Suggerimenti di ricette basati sugli ingredienti disponibili</li>
              <li>Lista della spesa automatica</li>
              <li>Notifiche su prodotti in scadenza</li>
              <li>Integrazione WhatsApp per gestione da chat</li>
              <li>Gamification e sfide per ridurre lo spreco</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">3. Account utente</h2>
            <p>
              Per utilizzare il servizio è necessario creare un account con email e password.
              Sei responsabile della sicurezza delle tue credenziali e di tutte le attività
              svolte tramite il tuo account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">4. Uso accettabile</h2>
            <p>Ti impegni a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Fornire informazioni accurate durante la registrazione</li>
              <li>Non utilizzare il servizio per scopi illegali o non autorizzati</li>
              <li>Non tentare di accedere ai dati di altri utenti</li>
              <li>Non sovraccaricare il servizio con richieste automatizzate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">5. Intelligenza artificiale</h2>
            <p>
              Il servizio utilizza modelli di intelligenza artificiale per suggerire ricette,
              analizzare ingredienti e stimare quantità. Questi suggerimenti sono indicativi
              e non sostituiscono il giudizio dell&apos;utente. In particolare:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Le date di scadenza sono stime basate su dati generali</li>
              <li>I suggerimenti di ricette non considerano allergie o intolleranze specifiche</li>
              <li>Le quantità suggerite dall&apos;AI sono approssimative</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">6. Disponibilità del servizio</h2>
            <p>
              Ci impegniamo a mantenere il servizio disponibile, ma non garantiamo
              un&apos;operatività ininterrotta. Potremmo sospendere temporaneamente il servizio
              per manutenzione o aggiornamenti.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">7. Proprietà intellettuale</h2>
            <p>
              Kitchen Steward e tutti i contenuti, funzionalità e tecnologie associate
              sono di proprietà di SPOAT SRL. I dati inseriti dall&apos;utente restano di proprietà
              dell&apos;utente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">8. Limitazione di responsabilità</h2>
            <p>
              Kitchen Steward è fornito &quot;così com&apos;è&quot;. Non siamo responsabili per
              perdite alimentari, decisioni basate sui suggerimenti dell&apos;AI, o interruzioni
              del servizio. L&apos;utente utilizza il servizio a proprio rischio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">9. Cancellazione</h2>
            <p>
              Puoi richiedere la cancellazione del tuo account in qualsiasi momento
              contattandoci a{' '}
              <a href="mailto:david@wearespoat.com" className="text-olive-600 underline">david@wearespoat.com</a>.
              Alla cancellazione, tutti i tuoi dati verranno rimossi permanentemente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">10. Modifiche ai termini</h2>
            <p>
              Ci riserviamo di modificare questi termini. Le modifiche saranno comunicate
              tramite l&apos;app o via email. L&apos;uso continuato del servizio dopo le modifiche
              implica l&apos;accettazione dei nuovi termini.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">11. Legge applicabile</h2>
            <p>
              I presenti termini sono regolati dalla legge italiana.
              Per qualsiasi controversia sarà competente il foro di Firenze.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">12. Contatti</h2>
            <p>
              Per domande sui presenti termini, scrivi a{' '}
              <a href="mailto:david@wearespoat.com" className="text-olive-600 underline">david@wearespoat.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
