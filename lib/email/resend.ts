/**
 * Emails transactionnels Resend — ex. commandes (confirmation, suivi).
 * https://resend.com/docs/api-reference/emails/send-email
 */

export type ResendAttachment = {
  filename: string;
  /** Contenu encodé en base64 */
  content: string;
};

export type ResendSendParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: ResendAttachment[];
};

export async function sendResendEmail(params: ResendSendParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY manquant' };
  }

  const from = process.env.RESEND_FROM?.trim() ?? "Heaven's By Elena <onboarding@resend.dev>";

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.attachments?.length ? { attachments: params.attachments } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[Resend]', res.status, errText);
      return { ok: false, error: errText || String(res.status) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Resend]', msg);
    return { ok: false, error: msg };
  }
}
