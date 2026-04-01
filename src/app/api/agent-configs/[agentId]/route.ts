import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseApiError } from "@/app/api/tenants/utils";

const updateAgentConfigSchema = z.object({
  businessName: z.string().min(1),
  ownerName: z.string().min(1),
  website: z.string().min(1),
  contactEmail: z.string().email(),
  signature: z.string().min(1),
  startingPrice: z.coerce.number().nonnegative(),
  callWindowStart: z.string().min(1),
  callWindowEnd: z.string().min(1),
  callWindowTimezone: z.string().min(1)
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const payload = updateAgentConfigSchema.parse(await request.json());

    const existingConfig = await db.agentConfig.findUnique({
      where: { agentId }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Agent config not found." },
        { status: 404 }
      );
    }

    const businessRules = existingConfig.businessRules as {
      callWindow?: {
        days?: string[];
        start?: string;
        end?: string;
        timezone?: string;
      };
      [key: string]: unknown;
    };

    const pricing = existingConfig.pricing as {
      startingPrice?: number;
      [key: string]: unknown;
    };

    const updated = await db.agentConfig.update({
      where: { agentId },
      data: {
        businessName: payload.businessName,
        ownerName: payload.ownerName,
        website: payload.website,
        contactEmail: payload.contactEmail,
        signature: payload.signature,
        pricing: {
          ...pricing,
          startingPrice: payload.startingPrice
        },
        businessRules: {
          ...businessRules,
          callWindow: {
            ...(businessRules.callWindow ?? {}),
            start: payload.callWindowStart,
            end: payload.callWindowEnd,
            timezone: payload.callWindowTimezone
          }
        }
      }
    });

    return NextResponse.json({ config: updated });
  } catch (error) {
    return NextResponse.json(
      { error: parseApiError(error) },
      { status: 400 }
    );
  }
}
