/**
 * Emails transactionnels Brevo (API v3), distincts du SMTP Brevo configuré dans Supabase Auth.
 * https://developers.brevo.com/reference/sendtransacemail
 */

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

export type BrevoSendParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendBrevoTransactional(params: BrevoSendParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: 'BREVO_API_KEY manquant' };
  }

  const email = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!email) {
    return { ok: false, error: 'BREVO_SENDER_EMAIL manquant' };
  }

  const name = process.env.BREVO_SENDER_NAME?.trim() || "Heaven's By Elena";

  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name, email },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        ...(params.text ? { textContent: params.text } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[Brevo]', res.status, errText);
      return { ok: false, error: errText || String(res.status) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Brevo]', msg);
    return { ok: false, error: msg };
  }
}
