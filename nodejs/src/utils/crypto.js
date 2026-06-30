function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

async function getAesKey(keyHex) {
  const keyBytes = hexToBytes(keyHex);
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPhone(phone, key) {
  if (!phone) return '';
  try {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const keyObj = await getAesKey(key);
    const data = textToBytes(phone);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      keyObj,
      data
    );
    return bytesToHex(iv) + ':' + bytesToHex(new Uint8Array(encrypted));
  } catch (e) {
    return '';
  }
}

export async function decryptPhone(encryptedPhone, key) {
  if (!encryptedPhone) return '';
  try {
    const parts = encryptedPhone.split(':');
    if (parts.length !== 2) return '';
    const iv = hexToBytes(parts[0]);
    const encrypted = hexToBytes(parts[1]);
    const keyObj = await getAesKey(key);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      keyObj,
      encrypted
    );
    return bytesToText(new Uint8Array(decrypted));
  } catch (e) {
    return '';
  }
}

export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  const hash = await pbkdf2(password, salt, 10000, 64);
  return `pbkdf2_sha256$10000$${salt}$${hash}`;
}

export async function verifyPassword(password, storedHash) {
  if (storedHash.startsWith('pbkdf2_sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const [, , salt, hash] = parts;
    const verifyHash = await pbkdf2(password, salt, 10000, 64);
    return hash === verifyHash;
  }
  if (storedHash.startsWith('$5$')) {
    const parts = storedHash.split('$');
    if (parts.length < 4) return false;
    const salt = parts[2];
    const hash = await pbkdf2(password, salt, 10000, 64);
    return storedHash.includes(hash.substring(0, 43));
  }
  return false;
}

async function pbkdf2(password, salt, iterations, keylen) {
  const passKey = await crypto.subtle.importKey(
    'raw',
    textToBytes(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: textToBytes(salt),
      iterations,
      hash: 'SHA-256'
    },
    passKey,
    keylen * 8
  );
  return bytesToHex(new Uint8Array(bits));
}
