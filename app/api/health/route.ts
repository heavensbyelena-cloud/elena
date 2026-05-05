import { NextResponse } from 'next/server';

/**
 * Santé minimale du déploiement (uptime / load balancer).
 * Ne renvoie aucune clé ni détail de configuration.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'heaven-by-elena',
    time: new Date().toISOString(),
  });
}
