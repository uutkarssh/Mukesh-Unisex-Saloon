// Firebase ID token verification WITHOUT the Admin SDK service account.
//
// The Firebase Admin SDK needs a service-account JSON to verify ID tokens,
// which we don't have in this sandbox. Instead, we verify the Firebase ID
// token (a RS256 JWT) directly using Google's public keys — the same way
// the Admin SDK does under the hood.
//
// Steps:
//   1. Fetch Google's public JWKS (cached for 1 hour).
//   2. Verify the JWT signature with the matching public key.
//   3. Validate the standard claims (iss, aud, exp, iat).
//
// This is safe because Firebase ID tokens are signed by Google's private
// keys; only Google can produce a token that validates against these public
// keys.

import { createRemoteJWKSet, jwtVerify } from 'jose'

// Firebase ID token JWKS URL (well-known).
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const FIREBASE_JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL))

// Firebase project ID from the client config — used to validate the issuer.
const FIREBASE_PROJECT_ID = 'gadgets-oz'

export async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string
  email: string | undefined
  emailVerified: boolean
}> {
  const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
    // Firebase ID tokens are issued by:
    //   https://securetoken.google.com/<projectId>
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    // Audience is the Firebase project ID.
    audience: FIREBASE_PROJECT_ID,
    // jose checks exp + iat automatically.
  })

  return {
    uid: String(payload.sub || ''),
    email: payload.email as string | undefined,
    emailVerified: !!payload.email_verified,
  }
}
