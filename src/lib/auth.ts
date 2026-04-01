import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const SESSION_COOKIE = "stafless_client_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function sessionFingerprint(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.APP_URL?.startsWith("https://") ?? false,
    path: "/",
    expires: expiresAt
  };
}

export async function createClientSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.clientSession.create({
    data: {
      userId,
      sessionToken: sessionFingerprint(token),
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function clearClientSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.clientSession.deleteMany({
      where: {
        sessionToken: sessionFingerprint(token)
      }
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentClientSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await db.clientSession.findUnique({
    where: {
      sessionToken: sessionFingerprint(token)
    },
    include: {
      user: {
        include: {
          tenant: true
        }
      }
    }
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await db.clientSession.delete({
        where: {
          id: session.id
        }
      });
    }

    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session;
}

export async function requireTenantAccess(slug: string) {
  const session = await getCurrentClientSession();

  if (!session) {
    redirect(`/login?next=/dashboard/${slug}`);
  }

  if (session.user.tenant.slug !== slug) {
    redirect(`/dashboard/${session.user.tenant.slug}`);
  }

  return session;
}
