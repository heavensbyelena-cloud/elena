/** Chemins relatifs autorisés après auth (évite l'open redirect). */
export function safeRedirectPath(raw: string | null, fallback = '/account/dashboard'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !/^\/[a-z]+:/i.test(trimmed)
  ) {
    return trimmed;
  }
  return fallback;
}
