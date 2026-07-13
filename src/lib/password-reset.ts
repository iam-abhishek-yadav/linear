import { createId } from "@paralleldrive/cuid2";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { passwordResetOtps, users } from "@/db/schema";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import { db, withDbRetry } from "@/lib/db";

export const PASSWORD_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const RESET_OTP_COOLDOWN_MS = 60 * 60 * 1000;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;

function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function getPasswordChangeRetryAt(passwordChangedAt: Date | null) {
  if (!passwordChangedAt) {
    return null;
  }

  const retryAt = new Date(
    passwordChangedAt.getTime() + PASSWORD_CHANGE_COOLDOWN_MS,
  );

  if (retryAt <= new Date()) {
    return null;
  }

  return retryAt;
}

export async function getLatestResetOtpRequest(userId: string) {
  const [latest] = await withDbRetry(() =>
    db
      .select({ createdAt: passwordResetOtps.createdAt })
      .from(passwordResetOtps)
      .where(eq(passwordResetOtps.userId, userId))
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1),
  );

  return latest?.createdAt ?? null;
}

export function getResetOtpRetryAt(lastRequestAt: Date | null) {
  if (!lastRequestAt) {
    return null;
  }

  const retryAt = new Date(lastRequestAt.getTime() + RESET_OTP_COOLDOWN_MS);

  if (retryAt <= new Date()) {
    return null;
  }

  return retryAt;
}

export async function requestPasswordResetOtp(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await withDbRetry(() =>
    db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1),
  );

  if (!user) {
    return { sent: false as const };
  }

  const lastRequestAt = await getLatestResetOtpRequest(user.id);
  const retryAt = getResetOtpRetryAt(lastRequestAt);

  if (retryAt) {
    return {
      sent: false as const,
      rateLimited: true as const,
      retryAt,
    };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 12);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await withDbRetry(() =>
    db.insert(passwordResetOtps).values({
      id: createId(),
      userId: user.id,
      otpHash,
      expiresAt,
    }),
  );

  await sendPasswordResetOtpEmail({
    to: user.email,
    otp,
    expiresAt,
  });

  return { sent: true as const };
}

export async function resetPasswordWithOtp({
  email,
  otp,
  newPassword,
  hashPassword,
}: {
  email: string;
  otp: string;
  newPassword: string;
  hashPassword: (password: string) => Promise<string>;
}) {
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await withDbRetry(() =>
    db
      .select({
        id: users.id,
        passwordChangedAt: users.passwordChangedAt,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1),
  );

  if (!user) {
    return { success: false as const, reason: "invalid" as const };
  }

  const [otpRecord] = await withDbRetry(() =>
    db
      .select()
      .from(passwordResetOtps)
      .where(
        and(
          eq(passwordResetOtps.userId, user.id),
          isNull(passwordResetOtps.usedAt),
          gt(passwordResetOtps.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1),
  );

  if (!otpRecord) {
    return { success: false as const, reason: "invalid" as const };
  }

  const otpValid = await bcrypt.compare(otp, otpRecord.otpHash);

  if (!otpValid) {
    return { success: false as const, reason: "invalid" as const };
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await withDbRetry(() =>
    db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash, passwordChangedAt: now })
        .where(eq(users.id, user.id));

      await tx
        .update(passwordResetOtps)
        .set({ usedAt: now })
        .where(eq(passwordResetOtps.id, otpRecord.id));
    }),
  );

  return { success: true as const };
}
