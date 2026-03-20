/**
 * Authenticated fetch wrapper.
 * Retrieves the Clerk session token and injects it as a Bearer token.
 * Falls back to unauthenticated fetch if Clerk is not available (e.g. local dev without auth).
 */

let _getToken: (() => Promise<string | null>) | null = null

/** Call this once from a React component/hook that has access to useAuth() */
export function setTokenProvider(getToken: () => Promise<string | null>) {
  _getToken = getToken
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!_getToken) return {}
  const token = await _getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  return fetch(input, {
    ...init,
    headers: {
      ...authHeaders,
      ...init.headers,
    },
  })
}
