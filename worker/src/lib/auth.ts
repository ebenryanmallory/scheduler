/**
 * Clerk JWT verification using the JWKS endpoint.
 * We verify the JWT manually using Web Crypto (available in CF Workers).
 */

let cachedJwks: JsonWebKey[] | null = null
let jwksCachedAt = 0
const JWKS_TTL_MS = 60 * 60 * 1000 // 1 hour

async function getJwks(clerkPublishableKey: string): Promise<JsonWebKey[]> {
  const now = Date.now()
  if (cachedJwks && now - jwksCachedAt < JWKS_TTL_MS) {
    return cachedJwks
  }

  // Derive JWKS URL from publishable key
  // Format: pk_live_<base64(frontendApiHost)> or pk_test_<base64(...)>
  const rawKey = clerkPublishableKey.replace(/^pk_(live|test)_/, '')
  let frontendApiHost: string
  try {
    frontendApiHost = atob(rawKey)
  } catch {
    throw new Error('Invalid Clerk publishable key format')
  }

  // Remove trailing $ if present
  const host = frontendApiHost.replace(/\$+$/, '')
  const jwksUrl = `https://${host}/.well-known/jwks.json`

  const res = await fetch(jwksUrl)
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`)
  const { keys } = (await res.json()) as { keys: JsonWebKey[] }

  cachedJwks = keys
  jwksCachedAt = now
  return keys
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

export async function getUserId(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const [headerB64, payloadB64, signatureB64] = parts

    // Decode header to get kid
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64))) as { kid?: string; alg?: string }
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as {
      sub?: string
      exp?: number
      iss?: string
    }

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    // Get JWKS and find matching key
    const keys = await getJwks(env.CLERK_PUBLISHABLE_KEY)
    const jwk = keys.find(k => (k as { kid?: string }).kid === header.kid) ?? keys[0]
    if (!jwk) return null

    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Verify signature
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const signature = base64UrlDecode(signatureB64)
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data)

    return valid && payload.sub ? payload.sub : null
  } catch {
    return null
  }
}

// Re-export Env type for use in this file
interface Env {
  CLERK_PUBLISHABLE_KEY: string
}
