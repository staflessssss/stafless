import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { recordRuntimeMessageEvent } from "@/lib/runtime-events";
import { parseApiError } from "@/app/api/tenants/utils";

const runtimeMessageSchema = z.object({
  tenantSlug: z.string().min(1),
  channel: z.string().min(1),
  externalThreadId: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")).nullable(),
  direction: z.enum(["inbound", "outbound"]),
  senderType: z.enum(["customer", "agent", "system"]),
  rawText: z.string().optional().nullable(),
  normalizedText: z.string().optional().nullable(),
  modelOutput: z.string().optional().nullable(),
  sentAt: z.string().datetime().optional().nullable()
});

function isAuthorized(request: NextRequest) {
  if (!env.N8N_API_KEY) {
    return true;
  }

  return request.headers.get("x-runtime-key") === env.N8N_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = runtimeMessageSchema.parse(await request.json());
    const result = await recordRuntimeMessageEvent({
      tenantSlug: payload.tenantSlug,
      channel: payload.channel,
      externalThreadId: payload.externalThreadId,
      customerEmail:
        payload.customerEmail && payload.customerEmail.length > 0
          ? payload.customerEmail
          : null,
      direction: payload.direction,
      senderType: payload.senderType,
      rawText: payload.rawText ?? null,
      normalizedText: payload.normalizedText ?? null,
      modelOutput: payload.modelOutput ?? null,
      sentAt: payload.sentAt ?? null
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
