import { db } from "@/lib/db";

export async function recordRuntimeMessageEvent(input: {
  tenantSlug: string;
  channel: string;
  externalThreadId: string;
  customerEmail?: string | null;
  direction: string;
  senderType: string;
  rawText?: string | null;
  normalizedText?: string | null;
  modelOutput?: string | null;
  sentAt?: string | null;
}) {
  const tenant = await db.tenant.findUnique({
    where: { slug: input.tenantSlug }
  });

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  const conversation = await db.conversation.upsert({
    where: {
      tenantId_channel_externalThreadId: {
        tenantId: tenant.id,
        channel: input.channel,
        externalThreadId: input.externalThreadId
      }
    },
    update: {
      customerEmail: input.customerEmail ?? undefined,
      lastMessageAt: input.sentAt ? new Date(input.sentAt) : new Date()
    },
    create: {
      tenantId: tenant.id,
      channel: input.channel,
      externalThreadId: input.externalThreadId,
      customerEmail: input.customerEmail ?? null,
      status: "ACTIVE",
      lastMessageAt: input.sentAt ? new Date(input.sentAt) : new Date()
    }
  });

  const message = await db.message.create({
    data: {
      conversationId: conversation.id,
      direction: input.direction,
      senderType: input.senderType,
      rawText: input.rawText ?? null,
      normalizedText: input.normalizedText ?? null,
      modelOutput: input.modelOutput ?? null,
      sentAt: input.sentAt ? new Date(input.sentAt) : null
    }
  });

  return {
    tenantId: tenant.id,
    conversationId: conversation.id,
    messageId: message.id
  };
}
