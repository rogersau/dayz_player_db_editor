const steamIdPattern = /^\d{17}$/;

export async function steamIdToUid(steamId: string): Promise<string | null> {
  if (!steamIdPattern.test(steamId)) {
    return null;
  }

  const bytes = new TextEncoder().encode(steamId);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toBase64(new Uint8Array(digest)).replaceAll('/', '_').replaceAll('+', '-');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';

  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  return btoa(binary);
}
