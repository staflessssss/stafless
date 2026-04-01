import { NextRequest, NextResponse } from "next/server";
import { RecordStatus } from "@prisma/client";
import { z } from "zod";
import { createClientSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

export async function POST(request: NextRequest) {
  const payload = loginSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "Provide a valid email and password." },
      { status: 400 }
    );
  }

  const user = await db.tenantUser.findUnique({
    where: {
      email: payload.data.email.toLowerCase()
    },
    include: {
      tenant: true
    }
  });

  if (
    !user ||
    user.status !== RecordStatus.ACTIVE ||
    !verifyPassword(payload.data.password, user.passwordHash)
  ) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  await db.clientSession.deleteMany({
    where: {
      userId: user.id
    }
  });

  await createClientSession(user.id);

  return NextResponse.json({
    success: true,
    redirectTo:
      payload.data.next && payload.data.next.startsWith("/dashboard/")
        ? payload.data.next
        : `/dashboard/${user.tenant.slug}`
  });
}
