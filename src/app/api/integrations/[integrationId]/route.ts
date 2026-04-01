import { NextRequest, NextResponse } from "next/server";
import { RecordStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseApiError } from "@/app/api/tenants/utils";

const updateIntegrationSchema = z.object({
  status: z.nativeEnum(RecordStatus),
  accountLabel: z.string().trim().optional().or(z.literal("")),
  credentialRef: z.string().trim().optional().or(z.literal(""))
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await context.params;
    const payload = updateIntegrationSchema.parse(await request.json());

    const integration = await db.integration.update({
      where: { id: integrationId },
      data: {
        status: payload.status,
        accountLabel: payload.accountLabel || null,
        credentialRef: payload.credentialRef || null,
        connectedAt: payload.status === RecordStatus.ACTIVE ? new Date() : null
      }
    });

    return NextResponse.json({ integration });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
