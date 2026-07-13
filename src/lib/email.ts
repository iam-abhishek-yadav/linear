import { Resend } from "resend";
import { getEnv } from "@/lib/env";

export function isEmailConfigured() {
  return Boolean(getEnv().RESEND_API_KEY);
}

function getResendClient() {
  const apiKey = getEnv().RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured");
  }

  return new Resend(apiKey);
}

function formatInviteExpiry(expiresAt: Date) {
  return expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildMemberInviteEmailHtml({
  inviteUrl,
  organizationName,
  inviterName,
  expiresAt,
}: {
  inviteUrl: string;
  organizationName: string;
  inviterName: string;
  expiresAt: Date;
}) {
  const expiryLabel = formatInviteExpiry(expiresAt);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="margin: 0 0 16px; font-size: 16px;">Hi there,</p>
      <p style="margin: 0 0 16px; font-size: 16px;">
        <strong>${inviterName}</strong> invited you to join
        <strong>${organizationName}</strong> on Mini Linear.
      </p>
      <p style="margin: 0 0 24px;">
        <a
          href="${inviteUrl}"
          style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;"
        >
          Accept invite
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
        Or copy this link into your browser:
      </p>
      <p style="margin: 0 0 24px; font-size: 14px; word-break: break-all; color: #374151;">
        ${inviteUrl}
      </p>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">
        This invite expires on ${expiryLabel}.
      </p>
    </div>
  `.trim();
}

function buildMemberInviteEmailText({
  inviteUrl,
  organizationName,
  inviterName,
  expiresAt,
}: {
  inviteUrl: string;
  organizationName: string;
  inviterName: string;
  expiresAt: Date;
}) {
  const expiryLabel = formatInviteExpiry(expiresAt);

  return [
    "Hi there,",
    "",
    `${inviterName} invited you to join ${organizationName} on Mini Linear.`,
    "",
    `Accept your invite: ${inviteUrl}`,
    "",
    `This invite expires on ${expiryLabel}.`,
  ].join("\n");
}

export async function sendMemberInviteEmail({
  to,
  inviteUrl,
  organizationName,
  inviterName,
  expiresAt,
}: {
  to: string;
  inviteUrl: string;
  organizationName: string;
  inviterName: string;
  expiresAt: Date;
}) {
  const resend = getResendClient();
  const from = getEnv().RESEND_FROM_EMAIL;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `Join ${organizationName} on Mini Linear`,
    html: buildMemberInviteEmailHtml({
      inviteUrl,
      organizationName,
      inviterName,
      expiresAt,
    }),
    text: buildMemberInviteEmailText({
      inviteUrl,
      organizationName,
      inviterName,
      expiresAt,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function buildPasswordResetOtpEmailHtml({
  otp,
  expiresAt,
}: {
  otp: string;
  expiresAt: Date;
}) {
  const expiryLabel = expiresAt.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="margin: 0 0 16px; font-size: 16px;">Hi there,</p>
      <p style="margin: 0 0 16px; font-size: 16px;">
        Use this code to reset your Mini Linear password:
      </p>
      <p style="margin: 0 0 24px; font-size: 32px; font-weight: 700; letter-spacing: 0.2em; color: #7c3aed;">
        ${otp}
      </p>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">
        This code expires at ${expiryLabel}. If you didn't request a reset, you can ignore this email.
      </p>
    </div>
  `.trim();
}

function buildPasswordResetOtpEmailText({
  otp,
  expiresAt,
}: {
  otp: string;
  expiresAt: Date;
}) {
  const expiryLabel = expiresAt.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return [
    "Hi there,",
    "",
    "Use this code to reset your Mini Linear password:",
    "",
    otp,
    "",
    `This code expires at ${expiryLabel}. If you didn't request a reset, you can ignore this email.`,
  ].join("\n");
}

export async function sendPasswordResetOtpEmail({
  to,
  otp,
  expiresAt,
}: {
  to: string;
  otp: string;
  expiresAt: Date;
}) {
  if (!isEmailConfigured()) {
    console.log("\n--- Password reset OTP ---");
    console.log(`Email: ${to}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("--------------------------\n");
    return;
  }

  const resend = getResendClient();
  const from = getEnv().RESEND_FROM_EMAIL;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Your Mini Linear password reset code",
    html: buildPasswordResetOtpEmailHtml({ otp, expiresAt }),
    text: buildPasswordResetOtpEmailText({ otp, expiresAt }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
