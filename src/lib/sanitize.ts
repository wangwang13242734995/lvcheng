export function sanitizeInput(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char] || char);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeInput(result[key] as string);
    }
  }
  return result;
}

const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'];

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateUrlOrNull(url: string | undefined | null): string | null {
  if (!url) return null;
  return isValidUrl(url) ? url : null;
}
