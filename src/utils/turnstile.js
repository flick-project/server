/**
 * @file Cloudflare Turnstile server-side token verification.
 * @module utils/turnstile
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verifies a Cloudflare Turnstile response token via the siteverify API.
 * Tokens are 5-minute expiry, single-use. Returns false on any failure
 * (missing token, missing secret, network error, invalid token).
 * @param {string} token - The turnstile response token from the client.
 * @param {string} [remoteIp] - Optional visitor IP for additional signal.
 * @returns {Promise<boolean>} Whether the token verified successfully.
 */
export async function verifyTurnstile (token, remoteIp) {
  if (!token) return false
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set')
    return false
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token
  })
  if (remoteIp) body.append('remoteip', remoteIp)

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body })
    const data = await res.json()
    if (!data.success) console.warn('Turnstile verify failed:', data['error-codes'])
    return data.success === true
  } catch (err) {
    console.error('Turnstile verify request failed:', err)
    return false
  }
}
