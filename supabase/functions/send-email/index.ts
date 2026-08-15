// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers pour autoriser les requêtes depuis Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Gestion des requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const payload = await req.json()
    const { record } = payload
    
    // Validation du payload
    if (!record || !record.title || !record.employee_name) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Récupération de l'email depuis les variables d'environnement
    const recipientEmail = Deno.env.get("RESEND_RECIPIENT_EMAIL")
    const senderEmail = Deno.env.get("RESEND_SENDER_EMAIL") || "onboarding@resend.dev"
    
    if (!recipientEmail) {
      console.error('RESEND_RECIPIENT_EMAIL non configuré')
      return new Response(
        JSON.stringify({ error: 'Email recipient not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [recipientEmail],
        subject: `Nouvelle tâche : ${record.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Nouvelle tâche assignée</h2>
            <p><strong>Employé :</strong> ${record.employee_name}</p>
            <p><strong>Tâche :</strong> ${record.title}</p>
            ${record.department ? `<p><strong>Département :</strong> ${record.department}</p>` : ''}
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Cette notification a été générée automatiquement par votre système d'onboarding/offboarding.
            </p>
          </div>
        `,
      }),
    })

    const responseData = await res.json()

    if (!res.ok) {
      console.error('Erreur Resend API:', responseData)
      return new Response(
        JSON.stringify({ success: false, error: responseData }),
        { 
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Erreur dans send-email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
