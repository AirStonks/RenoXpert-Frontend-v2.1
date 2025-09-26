/**
 * Generates HMAC (Hash-based Message Authentication Code) using Web Crypto API
 * @param message - The message to hash
 * @param secret - The secret key for HMAC (optional, defaults to a predefined secret)
 * @param algorithm - The hash algorithm to use (defaults to 'SHA-256')
 * @returns Promise<string> - The HMAC as a hex string
 */
export async function generateHmac(
  message: string,
  secret: string = 'default-secret-key',
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  try {
    // Convert the secret to a CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    // Generate the HMAC
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(message)
    );

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error generating HMAC:', error);
    throw new Error('Failed to generate HMAC');
  }
}

/**
 * Synchronous version of HMAC generation using a simple hash function
 * Note: This is less secure than the async version but useful for simple cases
 * @param message - The message to hash
 * @param secret - The secret key for HMAC (optional, defaults to a predefined secret)
 * @returns string - The HMAC as a hex string
 */
export function generateHmacSync(message: string, secret: string = 'default-secret-key'): string {
  // Simple hash function for synchronous use
  // Note: This is not cryptographically secure, use generateHmac() for production
  let hash = 0;
  const combined = message + secret;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Generate HMAC for user identification (commonly used for Chatwoot integration)
 * @param userId - The user ID to hash
 * @param secret - Optional secret key
 * @returns Promise<string> - The HMAC as a hex string
 */
export async function generateUserHmac(userId: string, secret?: string): Promise<string> {
  return generateHmac(userId, secret);
}
