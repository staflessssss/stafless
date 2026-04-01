import { NextResponse } from "next/server";
import { createMyndfulTenantSetup } from "@/lib/provisioning";

export async function POST() {
  const result = await createMyndfulTenantSetup();

  return NextResponse.json({
    success: true,
    tenantId: result.tenant.id,
    agentId: result.agent.id,
    templateId: result.template.id
  });
}
