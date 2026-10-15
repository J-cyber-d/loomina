import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.LOOMINA_EMBED_SECRET || 'dev_secret_key_12345')
  .digest();

export function encryptCredentials(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptCredentials(encryptedPayload: string): string {
  const [ivHex, authTagHex, encryptedData] = encryptedPayload.split(':');
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
