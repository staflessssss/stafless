import { NextRequest, NextResponse } from "next/server";
import { RecordStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { reprovisionAgent } from "@/lib/agent-provisioning";
import { parseApiError } from "@/app/api/tenants/utils";

const updateAgentSchema = z.object({
  status: z.nativeEnum(RecordStatus).optional(),
  action: z.enum(["reprovision"]).optional(),
  workflowKeys: z.array(z.string().min(1)).optional()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const payload = updateAgentSchema.parse(await request.json());

    if (payload.action === "reprovision") {
      const agent = await reprovisionAgent({
        agentId,
        workflowKeys: payload.workflowKeys
      });

      return NextResponse.json({ agent });
    }

    if (!payload.status) {
      return NextResponse.json(
        { error: "Provide either a status update or action." },
        { status: 400 }
      );
    }

    const agent = await db.agent.update({
      where: { id: agentId },
      data: {
        status: payload.status
      }
    });

    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
