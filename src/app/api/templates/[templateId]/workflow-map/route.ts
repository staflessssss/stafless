import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseApiError } from "@/app/api/tenants/utils";

const workflowMapSchema = z.object({
  handle_incoming_message: z.string().trim().optional().or(z.literal("")),
  check_availability: z.string().trim().optional().or(z.literal("")),
  check_calendar: z.string().trim().optional().or(z.literal("")),
  book_call: z.string().trim().optional().or(z.literal("")),
  send_reply: z.string().trim().optional().or(z.literal(""))
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await context.params;
    const payload = workflowMapSchema.parse(await request.json());

    const workflowTemplateMap = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => Boolean(value))
    );

    const template = await db.agentTemplate.update({
      where: { id: templateId },
      data: {
        workflowTemplateMap
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
