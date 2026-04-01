import { NextRequest, NextResponse } from "next/server";
import { requireTenantAccess } from "@/lib/auth";
import { createOAuthAuthorizationUrl } from "@/lib/oauth";
import { getIntegrationLabel, parseIntegrationType } from "@/lib/integrations";

function redirectBack(request: NextRequest, slug: string, params: URLSearchParams) {
  const url = new URL(`/dashboard/${slug}/integrations`, request.url);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; integrationType: string }> }
) {
  const { slug, integrationType } = await context.params;
  await requireTenantAccess(slug);
  const parsedType = parseIntegrationType(integrationType);

  if (!parsedType) {
    return redirectBack(
      request,
      slug,
      new URLSearchParams({
        error: "We could not recognize that channel."
      })
    );
  }

  try {
    const authorizationUrl = await createOAuthAuthorizationUrl({
      tenantSlug: slug,
      integrationType: parsedType
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `${getIntegrationLabel(parsedType)} is not ready to connect yet.`;

    return redirectBack(
      request,
      slug,
      new URLSearchParams({
        error: message
      })
    );
  }
}
