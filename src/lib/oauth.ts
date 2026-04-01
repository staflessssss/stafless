import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { IntegrationType, RecordStatus } from "@prisma/client";
import { reprovisionAgent } from "@/lib/agent-provisioning";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getIntegrationLabel } from "@/lib/integrations";
import { createN8nCredential } from "@/lib/n8n";

const OAUTH_STATE_COOKIE = "stafless_integration_oauth";
const OAUTH_STATE_TTL_MS = 1000 * 60 * 10;
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly"
].join(" ");
const META_SCOPES = [
  "pages_show_list",
  "pages_manage_metadata",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_messages",
  "business_management"
].join(",");

type OAuthProvider = "google" | "meta";

type OAuthStatePayload = {
  nonce: string;
  provider: OAuthProvider;
  tenantSlug: string;
  integrationType: IntegrationType;
  redirectTo: string;
  expiresAt: number;
};

type ConnectedIntegrationResult = {
  integrationType: IntegrationType;
  status: RecordStatus;
  accountLabel: string;
  credentialRef: string;
  connectedAt: Date;
};

type OAuthConnectResult = {
  integrations: ConnectedIntegrationResult[];
};

type GoogleIntegrationType =
  | "GMAIL"
  | "GOOGLE_CALENDAR"
  | "GOOGLE_SHEETS"
  | "GOOGLE_DRIVE";

function getOAuthSecret() {
  return env.OAUTH_STATE_SECRET ?? env.DATABASE_URL;
}

function signState(payload: string) {
  return createHmac("sha256", getOAuthSecret()).update(payload).digest("hex");
}

function encodeState(payload: OAuthStatePayload) {
  const serialized = JSON.stringify(payload);
  const encoded = Buffer.from(serialized, "utf8").toString("base64url");
  return `${encoded}.${signState(encoded)}`;
}

function decodeState(value: string) {
  const [encoded, signature] = value.split(".");

  if (!encoded || !signature || signState(encoded) !== signature) {
    throw new Error("Invalid connection state.");
  }

  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;

  if (parsed.expiresAt <= Date.now()) {
    throw new Error("This connection link expired. Please try again.");
  }

  return parsed;
}

function getProviderForIntegration(integrationType: IntegrationType): OAuthProvider | null {
  switch (integrationType) {
    case IntegrationType.GMAIL:
    case IntegrationType.GOOGLE_CALENDAR:
    case IntegrationType.GOOGLE_SHEETS:
    case IntegrationType.GOOGLE_DRIVE:
      return "google";
    case IntegrationType.INSTAGRAM:
      return "meta";
    default:
      return null;
  }
}

function getWorkflowKeysForIntegration(integrationType: IntegrationType) {
  switch (integrationType) {
    case IntegrationType.GMAIL:
      return ["gmail_adapter"];
    case IntegrationType.GOOGLE_DRIVE:
      return ["handle_incoming_message"];
    case IntegrationType.GOOGLE_CALENDAR:
      return ["check_calendar", "book_call"];
    case IntegrationType.GOOGLE_SHEETS:
      return ["check_availability", "book_call"];
    case IntegrationType.INSTAGRAM:
      return ["instagram_adapter"];
    default:
      return [];
  }
}

function getCallbackUrl(provider: OAuthProvider) {
  if (!env.APP_URL) {
    throw new Error("APP_URL is not configured.");
  }

  return `${env.APP_URL.replace(/\/$/, "")}/api/oauth/callback/${provider}`;
}

export function isOAuthConfigured(integrationType: IntegrationType) {
  if (integrationType === IntegrationType.GMAIL) {
    return Boolean(env.APP_URL && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  if (integrationType === IntegrationType.INSTAGRAM) {
    return Boolean(env.APP_URL && env.META_CLIENT_ID && env.META_CLIENT_SECRET);
  }

  return false;
}

export async function createOAuthAuthorizationUrl(input: {
  tenantSlug: string;
  integrationType: IntegrationType;
}) {
  const provider = getProviderForIntegration(input.integrationType);

  if (!provider) {
    throw new Error(`${getIntegrationLabel(input.integrationType)} is not ready for self-serve connect yet.`);
  }

  if (!isOAuthConfigured(input.integrationType)) {
    throw new Error(`${getIntegrationLabel(input.integrationType)} connect is not configured yet.`);
  }

  const statePayload: OAuthStatePayload = {
    nonce: randomBytes(16).toString("hex"),
    provider,
    tenantSlug: input.tenantSlug,
    integrationType: input.integrationType,
    redirectTo: `/dashboard/${input.tenantSlug}/integrations`,
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS
  };
  const encodedState = encodeState(statePayload);
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE, encodedState, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_URL?.startsWith("https://") ?? false,
    path: "/",
    expires: new Date(statePayload.expiresAt)
  });

  if (provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
    url.searchParams.set("redirect_uri", getCallbackUrl("google"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("scope", GOOGLE_SCOPES);
    url.searchParams.set("state", encodedState);
    return url.toString();
  }

  const url = new URL("https://www.facebook.com/v22.0/dialog/oauth");
  url.searchParams.set("client_id", env.META_CLIENT_ID!);
  url.searchParams.set("redirect_uri", getCallbackUrl("meta"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES);
  url.searchParams.set("state", encodedState);
  return url.toString();
}

export async function consumeOAuthState(expectedProvider: OAuthProvider, rawState: string) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!cookieValue || cookieValue !== rawState) {
    throw new Error("We could not verify this connection request. Please try again.");
  }

  const payload = decodeState(rawState);

  if (payload.provider !== expectedProvider) {
    throw new Error("This connection request was sent to the wrong provider callback.");
  }

  cookieStore.delete(OAUTH_STATE_COOKIE);
  return payload;
}

async function postForm<T>(url: string, params: URLSearchParams) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("The provider did not complete the connection.");
  }

  return (await response.json()) as T;
}

async function getJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("We could not finish loading the connected account.");
  }

  return (await response.json()) as T;
}

async function createGoogleCredential(input: {
  tenantSlug: string;
  integrationType: IntegrationType;
  email: string;
  tokens: {
    access_token: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expires_in?: number;
  };
}) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.N8N_BASE_URL || !env.N8N_API_KEY) {
    throw new Error("Google credential sync is not configured for n8n.");
  }

  const credentialType =
    input.integrationType === IntegrationType.GMAIL
      ? "gmailOAuth2"
      : input.integrationType === IntegrationType.GOOGLE_CALENDAR
        ? "googleCalendarOAuth2Api"
        : input.integrationType === IntegrationType.GOOGLE_SHEETS
          ? "googleSheetsOAuth2Api"
          : "googleDriveOAuth2Api";
  const credentialName = `${input.tenantSlug} :: ${getIntegrationLabel(input.integrationType)} :: ${input.email}`;
  const expiresIn = input.tokens.expires_in ?? 3600;
  const nodesAccess =
    input.integrationType === IntegrationType.GMAIL
      ? [
          { nodeType: "n8n-nodes-base.gmailTrigger", nodeTypeVersion: 1 },
          { nodeType: "n8n-nodes-base.gmail", nodeTypeVersion: 2 }
        ]
      : input.integrationType === IntegrationType.GOOGLE_CALENDAR
        ? [{ nodeType: "n8n-nodes-base.googleCalendar" }]
        : input.integrationType === IntegrationType.GOOGLE_SHEETS
          ? [{ nodeType: "n8n-nodes-base.googleSheets" }]
          : [{ nodeType: "n8n-nodes-base.googleDrive" }];

  try {
    const credential = await createN8nCredential({
      name: credentialName,
      type: credentialType,
      nodesAccess,
      data: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        accessToken: input.tokens.access_token,
        refreshToken: input.tokens.refresh_token ?? "",
        tokenType: input.tokens.token_type ?? "Bearer",
        expiresIn,
        scope: input.tokens.scope ?? GOOGLE_SCOPES,
        oauthTokenData: {
          access_token: input.tokens.access_token,
          refresh_token: input.tokens.refresh_token ?? "",
          scope: input.tokens.scope ?? GOOGLE_SCOPES,
          token_type: input.tokens.token_type ?? "Bearer",
          expiry_date: Date.now() + expiresIn * 1000
        }
      }
    });

    return `${credentialType}:${credential.id}:${credentialName}`;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error creating n8n credential.";

    console.error("[oauth] Failed to create Google credential in n8n", {
      tenantSlug: input.tenantSlug,
      integrationType: input.integrationType,
      email: input.email,
      credentialType,
      credentialName,
      message
    });

    throw new Error(
      `Failed to create ${getIntegrationLabel(input.integrationType)} credential in n8n: ${message}`
    );
  }
}

async function createGoogleCredentialRefs(input: {
  tenantSlug: string;
  email: string;
  tokens: {
    access_token: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expires_in?: number;
  };
}) {
  const googleIntegrationTypes: GoogleIntegrationType[] = [
    IntegrationType.GMAIL,
    IntegrationType.GOOGLE_CALENDAR,
    IntegrationType.GOOGLE_SHEETS,
    IntegrationType.GOOGLE_DRIVE
  ];

  const settledCredentials = await Promise.allSettled(
    googleIntegrationTypes.map(async (integrationType) => ({
      integrationType,
      credentialRef: await createGoogleCredential({
        tenantSlug: input.tenantSlug,
        integrationType,
        email: input.email,
        tokens: input.tokens
      })
    }))
  );

  const failedCredentials = settledCredentials
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);

  if (failedCredentials.length > 0) {
    const firstFailure = failedCredentials[0];
    const message =
      firstFailure instanceof Error ? firstFailure.message : "Unknown error creating n8n credentials.";

    throw new Error(message);
  }

  return settledCredentials
    .filter((result): result is PromiseFulfilledResult<{
      integrationType: GoogleIntegrationType;
      credentialRef: string;
    }> => result.status === "fulfilled")
    .map((result) => result.value);
}

async function connectGoogleWorkspace(
  state: OAuthStatePayload,
  code: string
): Promise<OAuthConnectResult> {
  const token = await postForm<{
    access_token: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expires_in?: number;
  }>("https://oauth2.googleapis.com/token", new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID!,
    client_secret: env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: getCallbackUrl("google"),
    grant_type: "authorization_code"
  }));

  const profile = await getJson<{ email: string; name?: string }>(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${encodeURIComponent(token.access_token)}`
  );
  const accountLabel = profile.email || profile.name || "Connected Gmail";
  const connectedAt = new Date();
  const credentialRefs = await createGoogleCredentialRefs({
    tenantSlug: state.tenantSlug,
    email: profile.email,
    tokens: token
  });

  return {
    integrations: credentialRefs.map((item) => ({
      integrationType: item.integrationType,
      status: RecordStatus.ACTIVE,
      accountLabel,
      credentialRef: item.credentialRef,
      connectedAt
    }))
  };
}

async function connectInstagram(state: OAuthStatePayload, code: string): Promise<OAuthConnectResult> {
  const shortToken = await getJson<{
    access_token: string;
    token_type?: string;
  }>(
    `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${encodeURIComponent(
      env.META_CLIENT_ID!
    )}&client_secret=${encodeURIComponent(env.META_CLIENT_SECRET!)}&redirect_uri=${encodeURIComponent(
      getCallbackUrl("meta")
    )}&code=${encodeURIComponent(code)}`
  );

  const longToken = await getJson<{
    access_token: string;
    token_type?: string;
    expires_in?: number;
  }>(
    `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
      env.META_CLIENT_ID!
    )}&client_secret=${encodeURIComponent(env.META_CLIENT_SECRET!)}&fb_exchange_token=${encodeURIComponent(
      shortToken.access_token
    )}`
  ).catch(() => shortToken);

  const pages = await getJson<{
    data?: Array<{
      id: string;
      name: string;
      instagram_business_account?: {
        id: string;
        username?: string;
      };
    }>;
  }>(
    `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(
      longToken.access_token
    )}`
  ).catch(() => ({ data: [] }));

  const linkedInstagram = pages.data?.find((page) => page.instagram_business_account?.id);
  const accountLabel =
    linkedInstagram?.instagram_business_account?.username ??
    linkedInstagram?.name ??
    "Connected Instagram";
  const accountId =
    linkedInstagram?.instagram_business_account?.id ?? linkedInstagram?.id ?? "instagram";

  return {
    integrations: [
      {
        integrationType: IntegrationType.INSTAGRAM,
        status: RecordStatus.ACTIVE,
        accountLabel,
        credentialRef: `facebookGraphApi:${accountId}:${accountLabel}`,
        connectedAt: new Date()
      }
    ]
  };
}

export async function finalizeOAuthConnection(input: {
  provider: OAuthProvider;
  code: string;
  state: OAuthStatePayload;
}) {
  const result =
    input.provider === "google"
      ? await connectGoogleWorkspace(input.state, input.code)
      : await connectInstagram(input.state, input.code);

  const tenant = await db.tenant.findUnique({
    where: { slug: input.state.tenantSlug }
  });

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  const integrations = await Promise.all(
    result.integrations.map((resolvedIntegration) =>
      db.integration.upsert({
        where: {
          tenantId_type: {
            tenantId: tenant.id,
            type: resolvedIntegration.integrationType
          }
        },
        update: {
          status: resolvedIntegration.status,
          accountLabel: resolvedIntegration.accountLabel,
          credentialRef: resolvedIntegration.credentialRef,
          connectedAt: resolvedIntegration.connectedAt
        },
        create: {
          tenantId: tenant.id,
          type: resolvedIntegration.integrationType,
          status: resolvedIntegration.status,
          accountLabel: resolvedIntegration.accountLabel,
          credentialRef: resolvedIntegration.credentialRef,
          connectedAt: resolvedIntegration.connectedAt
        }
      })
    )
  );

  const agents = await db.agent.findMany({
    where: {
      tenantId: tenant.id
    },
    select: {
      id: true
    }
  });

  const workflowKeys = Array.from(
    new Set(
      result.integrations.flatMap((resolvedIntegration) =>
        getWorkflowKeysForIntegration(resolvedIntegration.integrationType)
      )
    )
  );

  if (workflowKeys.length > 0) {
    await Promise.all(
      agents.map((agent) =>
        reprovisionAgent({
          agentId: agent.id,
          workflowKeys
        }).catch(() => null)
      )
    );
  }

  const primaryIntegration =
    integrations.find(
      (integration) => integration.type === input.state.integrationType
    ) ?? integrations[0];

  return {
    integration: primaryIntegration,
    integrations,
    redirectTo: input.state.redirectTo
  };
}
