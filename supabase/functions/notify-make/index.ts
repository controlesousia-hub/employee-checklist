// Passerelle serveur entre l'app et Make.com.
// L'URL du webhook Make est stockée en secret, jamais exposée au client.
// Par défaut, cette fonction vérifie le JWT Supabase : seuls les
// utilisateurs connectés peuvent l'appeler.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { type, record } = body ?? {};

    // Validation minimale du payload
    if (
      typeof type !== 'string' ||
      !record ||
      typeof record.title !== 'string' ||
      typeof record.employee_name !== 'string' ||
      typeof record.department !== 'string'
    ) {
      return json({ error: 'Invalid payload' }, 400);
    }

    const webhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('Secret MAKE_WEBHOOK_URL manquant');
      return json({ error: 'Webhook not configured' }, 500);
    }

    // Appel Make côté serveur
    const makeResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, record }),
    });

    if (!makeResponse.ok) {
      console.error('Erreur webhook Make :', makeResponse.status);
      // On ne bloque pas l'app : la tâche est déjà créée en base
      return json({ ok: false, warning: 'Notification failed' }, 200);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error('Erreur notify-make :', err);
    return json({ error: 'Internal error' }, 500);
  }
});