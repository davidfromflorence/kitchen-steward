'use client'

import { useActionState } from 'react'
import { MessageCircle, Check } from 'lucide-react'
import { updatePhoneNumber } from './actions'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type State = { success?: boolean; error?: string } | null

async function submitPhoneNumber(_prev: State, formData: FormData): Promise<State> {
  return updatePhoneNumber(formData)
}

export function WhatsAppLinkForm({
  phoneNumber,
}: {
  phoneNumber: string | null
}) {
  const [state, formAction, isPending] = useActionState(submitPhoneNumber, null)

  const isLinked = !!phoneNumber

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex-row items-center gap-2 px-6 py-5">
        <MessageCircle className="w-5 h-5 text-green-600" />
        <CardTitle className="text-lg font-bold text-slate-800">
          WhatsApp Integration
        </CardTitle>
        {isLinked && (
          <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
            <Check className="w-3 h-3" />
            Collegato
          </Badge>
        )}
      </CardHeader>
      <CardContent className="px-6 py-5 space-y-4">
        <p className="text-sm text-slate-500">
          Collega il tuo numero WhatsApp per aggiungere articoli al frigo
          tramite chat.
        </p>

        {isLinked ? (
          <div className="flex items-center gap-2 py-2">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-slate-800 font-medium font-mono">
              {phoneNumber}
            </span>
          </div>
        ) : null}

        <form action={formAction} className="flex gap-2">
          <Input
            type="tel"
            name="phone_number"
            placeholder="+39 333 123 4567"
            defaultValue={phoneNumber ?? ''}
            className="flex-1 h-10 rounded-xl"
            required
          />
          <Button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white h-10 px-4 font-semibold shrink-0"
          >
            {isPending
              ? 'Salvataggio...'
              : isLinked
                ? 'Aggiorna'
                : 'Collega WhatsApp'}
          </Button>
        </form>

        {state?.error && (
          <p className="text-sm text-red-600 font-medium">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-600 font-medium">
            Numero salvato con successo!
          </p>
        )}

        <Separator className="bg-slate-100" />

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Come configurare
          </p>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
            <li>
              Salva il numero{' '}
              <span className="font-mono font-semibold text-slate-800">
                +1 415 523 8886
              </span>{' '}
              nei tuoi contatti come &quot;Kitchen Steward&quot;
            </li>
            <li>
              Invia{' '}
              <span className="font-mono font-semibold text-slate-800">
                join [sandbox-code]
              </span>{' '}
              su WhatsApp a quel numero
            </li>
            <li>
              Poi scrivi cosa hai comprato, es:{' '}
              <span className="italic text-slate-500">
                &quot;Ho comprato 2 kg di pollo e 6 uova&quot;
              </span>
            </li>
          </ol>
          <p className="text-xs text-slate-400 mt-3">
            Il numero e il codice sandbox sono forniti da Twilio e verranno
            aggiornati con quelli definitivi.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
