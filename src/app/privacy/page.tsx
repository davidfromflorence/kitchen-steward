import { Leaf } from 'lucide-react'

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Ultimo aggiornamento: 21 marzo 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">1. Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati personali è SPOAT SRL, con sede legale in Italia.
              Per qualsiasi richiesta relativa alla privacy, puoi contattarci all&apos;indirizzo:{' '}
              <a href="mailto:david@wearespoat.com" className="text-olive-600 underline">david@wearespoat.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">2. Dati raccolti</h2>
            <p>Raccogliamo i seguenti dati:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Dati di registrazione:</strong> nome, indirizzo email, password (criptata)</li>
              <li><strong>Dati del nucleo familiare:</strong> nome del nucleo, codice di invito</li>
              <li><strong>Inventario alimentare:</strong> nome prodotto, quantità, unità, categoria, zona, data di scadenza</li>
              <li><strong>Lista della spesa:</strong> articoli, categorie, note</li>
              <li><strong>Numero WhatsApp:</strong> solo se collegato volontariamente dall&apos;utente nelle impostazioni</li>
              <li><strong>Dati di utilizzo:</strong> interazioni con l&apos;app, punteggio gamification (memorizzato localmente)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">3. Finalità del trattamento</h2>
            <p>I tuoi dati vengono utilizzati per:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Fornirti il servizio di gestione del frigo e inventario alimentare</li>
              <li>Generare suggerimenti di ricette tramite intelligenza artificiale (Google Gemini)</li>
              <li>Inviarti notifiche su prodotti in scadenza via WhatsApp (se collegato)</li>
              <li>Gestire il nucleo familiare e la condivisione dei dati tra membri</li>
              <li>Migliorare il servizio e l&apos;esperienza utente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">4. Base giuridica</h2>
            <p>
              Il trattamento dei dati si basa sul consenso dell&apos;utente al momento della registrazione e,
              per alcune funzionalità (come WhatsApp), su un consenso specifico e separato.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">5. Servizi di terze parti</h2>
            <p>Utilizziamo i seguenti servizi di terze parti:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> (database e autenticazione) — dati archiviati su server EU</li>
              <li><strong>Google Gemini</strong> (AI) — per analisi ingredienti e suggerimenti ricette</li>
              <li><strong>Twilio</strong> (WhatsApp) — per l&apos;invio e ricezione di messaggi WhatsApp</li>
              <li><strong>Vercel</strong> (hosting) — per l&apos;erogazione dell&apos;applicazione web</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">6. Conservazione dei dati</h2>
            <p>
              I dati vengono conservati per tutta la durata dell&apos;utilizzo del servizio.
              Puoi richiedere la cancellazione del tuo account e di tutti i dati associati
              contattandoci via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">7. Diritti dell&apos;utente (GDPR)</h2>
            <p>In conformità al Regolamento (UE) 2016/679, hai diritto a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Accedere ai tuoi dati personali</li>
              <li>Rettificare dati inesatti</li>
              <li>Richiedere la cancellazione dei tuoi dati</li>
              <li>Limitare o opporti al trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p className="mt-2">
              Per esercitare questi diritti, scrivi a{' '}
              <a href="mailto:david@wearespoat.com" className="text-olive-600 underline">david@wearespoat.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">8. Cookie</h2>
            <p>
              Utilizziamo solo cookie tecnici necessari per l&apos;autenticazione e il funzionamento
              dell&apos;applicazione. Non utilizziamo cookie di profilazione o di marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">9. Modifiche</h2>
            <p>
              Ci riserviamo di aggiornare questa informativa. Le modifiche saranno pubblicate
              su questa pagina con la data di aggiornamento.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
