import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseApiError } from "@/app/api/tenants/utils";

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1).default("America/New_York")
});

export async function GET() {
  const tenants = await db.tenant.findMany({
    include: {
      agents: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ tenants });
}

export async function POST(request: NextRequest) {
  try {
    const payload = createTenantSchema.parse(await request.json());

    const tenant = await db.tenant.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        timezone: payload.timezone,
        status: "DRAFT"
      }
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
