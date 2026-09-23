/**
 * Safe platform detection utility.
 * 
 * Accurately determines if the application is currently running inside
 * the Tauri desktop container (Windows WebView2) or in a standard
 * web browser / standalone PWA.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
}

/**
 * Returns human-readable platform description for UI status indicators.
 */
export function getPlatformName(): string {
  if (isTauri()) {
    return 'Desktop App';
  }
  return 'Web / PWA';
}
