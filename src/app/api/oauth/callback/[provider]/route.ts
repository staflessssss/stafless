import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientSession } from "@/lib/auth";
import { consumeOAuthState, finalizeOAuthConnection } from "@/lib/oauth";

function buildRedirect(request: NextRequest, slug: string, params: URLSearchParams) {
  const url = new URL(`/dashboard/${slug}/integrations`, request.url);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const resolvedProvider = provider === "google" || provider === "meta" ? provider : null;
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");

  if (!state || !resolvedProvider) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let resolvedState;

  try {
    resolvedState = await consumeOAuthState(resolvedProvider, state);
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          error instanceof Error
            ? error.message
            : "The connection link could not be verified."
        )}`,
        request.url
      )
    );
  }

  const session = await getCurrentClientSession();

  if (!session || session.user.tenant.slug !== resolvedState.tenantSlug) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(resolvedState.redirectTo)}`, request.url)
    );
  }

  if (providerError || !code) {
    return buildRedirect(
      request,
      resolvedState.tenantSlug,
      new URLSearchParams({
        error: "The channel connection was canceled before it finished."
      })
    );
  }

  try {
    const result = await finalizeOAuthConnection({
      provider: resolvedProvider,
      code,
      state: resolvedState
    });

    return buildRedirect(
      request,
      resolvedState.tenantSlug,
      new URLSearchParams({
        connected: result.integration.type.toLowerCase()
      })
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We could not finish connecting that account. Please try again.";

    return buildRedirect(
      request,
      resolvedState.tenantSlug,
      new URLSearchParams({
        error: message
      })
    );
  }
}
