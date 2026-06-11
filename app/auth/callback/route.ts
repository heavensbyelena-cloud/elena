/**
 * GET /auth/callback
 * Alias pour OAuth et anciens liens de confirmation.
 */
import { NextRequest } from 'next/server';
import { handleAuthEmailConfirm } from '@/lib/auth-email-confirm';

export async function GET(request: NextRequest) {
  return handleAuthEmailConfirm(request);
}
