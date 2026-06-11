/**
 * GET /auth/confirm
 * Route attendue par Supabase (PKCE) après clic sur le lien de confirmation d’email.
 */
import { NextRequest } from 'next/server';
import { handleAuthEmailConfirm } from '@/lib/auth-email-confirm';

export async function GET(request: NextRequest) {
  return handleAuthEmailConfirm(request);
}
