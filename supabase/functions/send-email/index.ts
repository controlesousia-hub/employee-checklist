// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore
serve(async (req: Request) => {
  const payload = await req.json()
  const { record } = payload

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // @ts-ignore
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: ["controlesousia@gmail.com"], // N'oubliez pas de mettre votre vrai email ici
      subject: `Nouvelle tâche : ${record.title}`,
      html: `<p>Tâche attribuée à : <strong>${record.employee_name}</strong></p>`,
    }),
  })

  return new Response(JSON.stringify({ success: true }), { 
    headers: { "Content-Type": "application/json" } 
  })
})