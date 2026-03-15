import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// POST — send a proactive WhatsApp message (e.g. expiry alerts)
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'phoneNumber e message sono obbligatori.' },
        { status: 400 }
      )
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER! // e.g. "whatsapp:+14155238886"

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const params = new URLSearchParams({
      From: twilioWhatsAppNumber,
      To: `whatsapp:${phoneNumber}`,
      Body: message,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Twilio send error:', response.status, errorBody)
      return NextResponse.json(
        { error: 'Invio messaggio fallito.', details: errorBody },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      sid: data.sid,
    })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json(
      { error: 'Errore interno durante l\'invio del messaggio.' },
      { status: 500 }
    )
  }
}
