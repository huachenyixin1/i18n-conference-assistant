// JWT implementation using Web Crypto API (compatible with Cloudflare Workers)

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToBase64url(bytes) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createToken(payload, secret, expiresInHours = 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInHours * 3600;
  const data = { ...payload, iat: now, exp };

  const base64Header = bytesToBase64url(textToBytes(JSON.stringify(header)));
  const base64Data = bytesToBase64url(textToBytes(JSON.stringify(data)));

  const message = `${base64Header}.${base64Data}`;
  const key = await crypto.subtle.importKey(
    'raw',
    textToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textToBytes(message)
  );

  const base64Signature = bytesToBase64url(new Uint8Array(signature));

  return `${message}.${base64Signature}`;
}

export async function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [base64Header, base64Data, base64Signature] = parts;
    const message = `${base64Header}.${base64Data}`;

    const key = await crypto.subtle.importKey(
      'raw',
      textToBytes(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlToBytes(base64Signature),
      textToBytes(message)
    );

    if (!isValid) return null;

    const data = JSON.parse(new TextDecoder().decode(base64urlToBytes(base64Data)));

    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return data;
  } catch (e) {
    return null;
  }
}