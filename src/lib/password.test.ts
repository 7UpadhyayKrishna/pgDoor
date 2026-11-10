import { describe, expect, it } from "vitest";
import {
  TEMP_PASSWORD_ALPHABET,
  TEMP_PASSWORD_LENGTH,
  generateTempPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/password";

describe("password hashing", () => {
  it("verifies the original password", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects missing or malformed hashes", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$abc$def")).toBe(false);
  });
});

describe("generateTempPassword", () => {
  it("has the expected length and only unambiguous characters", () => {
    for (let i = 0; i < 50; i += 1) {
      const pwd = generateTempPassword();
      expect(pwd).toHaveLength(TEMP_PASSWORD_LENGTH);
      for (const ch of pwd) expect(TEMP_PASSWORD_ALPHABET).toContain(ch);
    }
  });

  it("never uses look-alike characters", () => {
    for (const ch of "0O1lI") expect(TEMP_PASSWORD_ALPHABET).not.toContain(ch);
  });
});
