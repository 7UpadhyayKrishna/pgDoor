import { SignJWT, jwtVerify } from "jose";

/** Shared password for /testing. Anyone with repo access can read it — rotate before sharing widely. */
export const TESTER_PASSWORD = "pgdoor-test-2026";

export const TESTER_COOKIE = "pgdoor_tester";
export const TESTER_TTL_DAYS = 7;

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-session-secret-pgdoor-local-only",
  );
}

export async function signTesterToken() {
  return new SignJWT({ tester: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TESTER_TTL_DAYS}d`)
    .sign(secret());
}

export async function verifyTesterToken(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.tester === true;
  } catch {
    return false;
  }
}
