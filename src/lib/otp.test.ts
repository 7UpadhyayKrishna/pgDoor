import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOtpCode, isDevOtp, sendOtp } from "@/lib/otp";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("dev OTP", () => {
  it("uses the bypass code in local dev", () => {
    vi.stubEnv("OTP_PROVIDER", "dev");
    vi.stubEnv("OTP_BYPASS_CODE", "123456");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isDevOtp()).toBe(true);
    expect(generateOtpCode()).toBe("123456");
  });

  it("never uses the bypass code on a production deploy", () => {
    vi.stubEnv("OTP_PROVIDER", "dev");
    vi.stubEnv("OTP_BYPASS_CODE", "123456");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isDevOtp()).toBe(false);
    expect(generateOtpCode()).not.toBe("123456");
    expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });

  it("refuses to pretend an SMS was sent in production without a provider", async () => {
    vi.stubEnv("OTP_PROVIDER", "dev");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(sendOtp("+919876543210", "111111")).rejects.toMatchObject({ status: 503 });
  });
});

describe("MSG91", () => {
  it("sends the code through MSG91 and reports delivery", async () => {
    vi.stubEnv("OTP_PROVIDER", "msg91");
    vi.stubEnv("MSG91_AUTH_KEY", "key");
    vi.stubEnv("MSG91_TEMPLATE_ID", "tpl");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ type: "success" }), { status: 200 }));
    await expect(sendOtp("+919876543210", "424242")).resolves.toMatchObject({ provider: "msg91" });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("template_id=tpl");
    expect(url).toContain("mobile=919876543210");
    expect(url).toContain("otp=424242");
  });

  it("surfaces an MSG91 rejection as a 502", async () => {
    vi.stubEnv("OTP_PROVIDER", "msg91");
    vi.stubEnv("MSG91_AUTH_KEY", "key");
    vi.stubEnv("MSG91_TEMPLATE_ID", "tpl");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ type: "error", message: "Invalid template" }), { status: 200 }),
    );
    await expect(sendOtp("+919876543210", "424242")).rejects.toMatchObject({ status: 502 });
  });
});
