/**
 * Twilio helpers — SERVER-SIDE ONLY.
 * Never import this file from a client component.
 */
import twilio from "twilio";
import type { MessageChannel } from "@/types";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken  = process.env.TWILIO_AUTH_TOKEN!;

export const twilioClient = twilio(accountSid, authToken);

/** E.164 SMS number, e.g. "+15005550006" */
export const TWILIO_SMS_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

/**
 * WhatsApp sender.
 * Sandbox default → +14155238886
 * Production      → your approved WhatsApp Business number
 */
export const TWILIO_WHATSAPP_NUMBER =
  process.env.TWILIO_WHATSAPP_NUMBER ?? "+14155238886";

/** Returns the correct "from" address for the chosen channel. */
export function getFromAddress(channel: MessageChannel): string {
  return channel === "whatsapp"
    ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}`
    : TWILIO_SMS_NUMBER;
}

/** Normalises a patient phone string and prefixes for the right channel. */
export function getToAddress(rawPhone: string, channel: MessageChannel): string {
  // Normalize to E.164 and reject invalid phone numbers before hitting Twilio.
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;
  if (!cleaned.startsWith("+")) cleaned = `+${cleaned}`;
  const e164 = `+${cleaned.slice(1).replace(/\D/g, "")}`;

  if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
    throw new Error("INVALID_TO_PHONE: Use full international format, e.g. +14155552671");
  }

  return channel === "whatsapp" ? `whatsapp:${e164}` : e164;
}

export function formatTwilioError(err: any): string {
  const numericCode = Number(err?.code);
  const code = err?.code ? `TWILIO_${err.code}` : "TWILIO_UNKNOWN";
  const message = err?.message ?? "Messaging failed";
  const status = err?.status ? ` (HTTP ${err.status})` : "";
  const moreInfo = err?.moreInfo ? ` ${err.moreInfo}` : "";

  let hint = "";
  if (numericCode === 21608) {
    hint = " Trial account: verify the recipient number in Twilio Console, or upgrade account to message unverified numbers.";
  } else if (numericCode === 21211) {
    hint = " Invalid destination format. Use E.164 format, e.g. +14155552671.";
  } else if (numericCode === 63007) {
    hint = " WhatsApp sender not configured for this From number. Use a valid WhatsApp-enabled Twilio sender or SMS.";
  } else if (numericCode === 30044) {
    hint = " Trial message too long. Shorten message content or upgrade Twilio account.";
  }

  return `${code}: ${message}${status}${hint}${moreInfo}`.trim();
}

export async function sendMessageWithFallback(
  body: string,
  rawPhone: string,
  channel: MessageChannel
): Promise<{ sid: string; usedChannel: MessageChannel; fallbackUsed: boolean }> {
  const normalizedBody = body
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const trialSafeBody = (normalizedBody || "Appointment update from clinic.").slice(0, 60);

  try {
    const msg = await twilioClient.messages.create({
      body,
      from: getFromAddress(channel),
      to: getToAddress(rawPhone, channel),
    });
    return { sid: msg.sid, usedChannel: channel, fallbackUsed: false };
  } catch (err: any) {
    // Trial accounts can reject longer bodies; retry once with compact short text.
    if (Number(err?.code) === 30044) {
      const msg = await twilioClient.messages.create({
        body: trialSafeBody,
        from: getFromAddress(channel),
        to: getToAddress(rawPhone, channel),
      });
      return { sid: msg.sid, usedChannel: channel, fallbackUsed: false };
    }

    // Fallback to SMS when WhatsApp sender is not configured in Twilio.
    if (channel === "whatsapp" && Number(err?.code) === 63007) {
      const msg = await twilioClient.messages.create({
        body,
        from: getFromAddress("sms"),
        to: getToAddress(rawPhone, "sms"),
      });
      return { sid: msg.sid, usedChannel: "sms", fallbackUsed: true };
    }
    throw err;
  }
}
