import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseApiError } from "@/app/api/tenants/utils";
import { getAgentCreationCheck } from "@/lib/agent-creation-check";
import { provisionAgent } from "@/lib/agent-provisioning";

const createAgentSchema = z.object({
  tenantId: z.string().min(1),
  templateId: z.string().min(1),
  name: z.string().min(1)
});

export async function GET() {
  const agents = await db.agent.findMany({
    include: {
      tenant: true,
      template: true,
      config: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  try {
    const payload = createAgentSchema.parse(await request.json());
    const [tenant, template] = await Promise.all([
      db.tenant.findUnique({
        where: { id: payload.tenantId },
        include: {
          integrations: {
            select: {
              type: true,
              status: true
            }
          }
        }
      }),
      db.agentTemplate.findUnique({
        where: { id: payload.templateId },
        select: {
          id: true,
          slug: true
        }
      })
    ]);

    if (!tenant) {
      throw new Error("Tenant not found.");
    }

    if (!template) {
      throw new Error("Template not found.");
    }

    const creationCheck = getAgentCreationCheck(
      template.slug,
      tenant.integrations
    );

    if (!creationCheck.canCreateAgent) {
      throw new Error(
        `Client setup is incomplete. Required connections still missing: ${creationCheck.missingIntegrationLabels.join(", ")}.`
      );
    }

    const agent = await provisionAgent({
      tenantId: payload.tenantId,
      templateId: payload.templateId,
      name: payload.name
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
