/** Logs réservés au développement local — évite de fuiter email / IDs en prod (logs Workers). */
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}
