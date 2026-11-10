const MSG91_OTP_URL = "https://control.msg91.com/api/v5/otp";

export class SmsDeliveryError extends Error {}

/** Sends our own generated code through MSG91's DLT-approved OTP template. */
export async function sendMsg91Otp(phone: string, code: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    throw new SmsDeliveryError("MSG91_AUTH_KEY and MSG91_TEMPLATE_ID must be set");
  }

  const params = new URLSearchParams({
    template_id: templateId,
    mobile: phone.replace(/\D/g, ""),
    otp: code,
  });
  if (process.env.MSG91_SENDER_ID) params.set("sender", process.env.MSG91_SENDER_ID);

  const res = await fetch(`${MSG91_OTP_URL}?${params}`, {
    method: "POST",
    headers: { authkey: authKey, "content-type": "application/json" },
    body: JSON.stringify({ otp: code }),
  });
  const data = (await res.json().catch(() => null)) as { type?: string; message?: string } | null;
  if (!res.ok || data?.type === "error") {
    throw new SmsDeliveryError(`MSG91 rejected the OTP: ${data?.message ?? res.status}`);
  }
}
