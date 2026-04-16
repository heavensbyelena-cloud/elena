/**
 * POST /api/auth/refresh-session
 * Retourne le rôle actuel depuis la session Supabase (getCurrentUser).
 * Le rafraîchissement des tokens Supabase est géré par le middleware.
 */
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const role = user.role ?? (user.is_admin ? 'admin' : 'user');
    return NextResponse.json({ role, message: 'Session actualisée' });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
