import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAgentChannelLabel,
  getDefaultAgentName,
  getSupportedAgentChannels,
  type AgentChannel
} from "@/lib/agent-channels";
import { getAgentCreationCheck } from "@/lib/agent-creation-check";
import { getAgentLaunchCheck } from "@/lib/agent-launch-check";
import { getTenantBySlug } from "@/lib/dashboard";
import { db } from "@/lib/db";
import {
  getIntegrationConnectMode,
  getIntegrationLabel,
  getVisibleIntegrationTypes
} from "@/lib/integrations";
import { ConfigEditor } from "./config-editor";
import { ConnectIntegrationButton } from "./connect-integration-button";
import { AgentOperatorPanel } from "./agent-operator-panel";
import { IntegrationOperatorForm } from "./integration-operator-form";
import { TenantCreateAgentForm } from "./tenant-create-agent-form";

function sectionCard(title: string, children: React.ReactNode) {
  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 24,
        background: "var(--surface)",
        padding: 24
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 24 }}>{title}</h2>
      {children}
    </section>
  );
}

function keyValue(label: string, value: React.ReactNode) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--line)"
      }}
    >
      <div style={{ color: "var(--muted)" }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function inferAgentChannel(workflowKeys: string[]): AgentChannel {
  return workflowKeys.includes("instagram_adapter") ? "instagram" : "gmail";
}

function getCredentialSyncState(credentialRef: string | null) {
  if (!credentialRef) {
    return "missing";
  }

  const parts = credentialRef.split(":");

  if (parts.length >= 3 && parts[1]) {
    return "synced";
  }

  return "fallback";
}

export default async function TenantDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tenant, templates] = await Promise.all([
    getTenantBySlug(slug),
    db.agentTemplate.findMany({
      orderBy: {
        createdAt: "asc"
      }
    })
  ]);

  if (!tenant) {
    notFound();
  }

  const selectedTemplate = templates[0] ?? null;
  const channelChecks =
    selectedTemplate
      ? getSupportedAgentChannels(selectedTemplate.slug).map((channel) => {
          const check = getAgentCreationCheck(
            selectedTemplate.slug,
            tenant.integrations,
            channel
          );

          return {
            value: channel,
            label: getAgentChannelLabel(channel),
            canCreate: check.canCreateAgent,
            missingLabels: check.missingIntegrationLabels,
            suggestedName: getDefaultAgentName(channel, tenant.name)
          };
        })
      : [];
  const visibleIntegrationTypes = selectedTemplate
    ? getVisibleIntegrationTypes(
        selectedTemplate.slug,
        tenant.integrations.map((integration) => integration.type)
      )
    : tenant.integrations.map((integration) => integration.type);
  const integrationsForDisplay = visibleIntegrationTypes.map((type) => {
    const integration = tenant.integrations.find((item) => item.type === type);

    return {
      id: integration?.id ?? `virtual-${type}`,
      type,
      status: integration?.status ?? "DRAFT",
      accountLabel: integration?.accountLabel ?? null,
      credentialRef: integration?.credentialRef ?? null,
      isSaved: Boolean(integration),
      connectMode: getIntegrationConnectMode(type)
    };
  });

  return (
    <main style={{ padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/admin"
            style={{ textDecoration: "none", color: "var(--muted)", fontSize: 14 }}
          >
            ← Back to admin
          </Link>
          <p
            style={{
              margin: "20px 0 0",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: 12,
              color: "var(--muted)"
            }}
          >
            Tenant Overview
          </p>
          <h1 style={{ margin: "10px 0", fontSize: 52 }}>{tenant.name}</h1>
          <p style={{ margin: 0, fontSize: 18, maxWidth: 820, lineHeight: 1.6 }}>
            Open one client, see exactly what they connected, create a channel-specific
            agent for them, and then review that agent&apos;s launch blockers.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
            gap: 20,
            alignItems: "start"
          }}
        >
          <div style={{ display: "grid", gap: 20 }}>
            {sectionCard(
              "Tenant Basics",
              <div>
                {keyValue("Slug", <code>{tenant.slug}</code>)}
                {keyValue("Status", tenant.status)}
                {keyValue("Timezone", tenant.timezone)}
                {keyValue("Agents", tenant.agents.length)}
                {keyValue("Saved integrations", tenant.integrations.length)}
                {keyValue("Workflow bindings", tenant.workflowBindings.length)}
              </div>
            )}

            {sectionCard(
              "Create Channel Agent",
              !selectedTemplate ? (
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  No templates are available yet.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
                    Create agents from this client&apos;s page, not from the global admin
                    page. Choose the channel you want to launch now.
                  </p>

                  <div style={{ display: "grid", gap: 10 }}>
                    {channelChecks.map((item) => (
                      <div
                        key={item.value}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 18,
                          padding: 14,
                          background: item.canCreate
                            ? "rgba(62,107,55,0.08)"
                            : "rgba(138,47,47,0.08)"
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 700 }}>{item.label}</p>
                        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                          {item.canCreate
                            ? "Ready to create now."
                            : `Still needed: ${item.missingLabels.join(", ")}.`}
                        </p>
                      </div>
                    ))}
                  </div>

                  <TenantCreateAgentForm
                    tenantId={tenant.id}
                    tenantName={tenant.name}
                    templates={templates.map((template) => ({
                      id: template.id,
                      name: template.name,
                      niche: template.niche
                    }))}
                    channels={channelChecks.map((item) => ({
                      value: item.value,
                      label: item.label,
                      missingLabels: item.missingLabels,
                      canCreate: item.canCreate
                    }))}
                  />
                </div>
              )
            )}

            {tenant.agents.length === 0 ? (
              sectionCard(
                "Agents",
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  No agents created for this client yet.
                </p>
              )
            ) : (
              tenant.agents.map((agent) => {
                const config = agent.config;
                const channel = inferAgentChannel(
                  agent.workflows.map((workflow) => workflow.workflowKey)
                );
                const launchCheck = getAgentLaunchCheck({
                  status: agent.status,
                  config: agent.config,
                  integrations: tenant.integrations,
                  workflows: agent.workflows
                });

                return sectionCard(
                  `${getAgentChannelLabel(channel)}: ${agent.name}`,
                  <div style={{ display: "grid", gap: 18 }}>
                    <div>
                      {keyValue("Template", agent.template.name)}
                      {keyValue("Channel", getAgentChannelLabel(channel))}
                      {keyValue("Status", agent.status)}
                      {keyValue("Launch stage", launchCheck.stage)}
                      {keyValue("Ready to launch", launchCheck.canLaunch ? "Yes" : "Not yet")}
                      {keyValue(
                        "Tools",
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {agent.toolConfigs.map((tool) => (
                            <span
                              key={tool.id}
                              style={{
                                border: "1px solid var(--line)",
                                borderRadius: 999,
                                padding: "6px 10px",
                                background: "rgba(255,255,255,0.5)"
                              }}
                            >
                              {tool.toolName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>Launch blockers</p>
                      {launchCheck.blockingItems.length === 0 ? (
                        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                          No blockers found.
                        </p>
                      ) : (
                        <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "var(--muted)" }}>
                          {launchCheck.blockingItems.map((item) => (
                            <li key={item} style={{ marginTop: 8 }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <AgentOperatorPanel
                      agentId={agent.id}
                      status={agent.status}
                      canActivate={launchCheck.canLaunch}
                      activateMessage={
                        launchCheck.canLaunch
                          ? undefined
                          : "Activation stays locked until the launch checklist is clear."
                      }
                    />

                    {config ? (
                      <div style={{ display: "grid", gap: 16 }}>
                        <div>
                          {keyValue("Business name", config.businessName)}
                          {keyValue("Owner", config.ownerName)}
                          {keyValue("Website", config.website)}
                          {keyValue("Contact email", config.contactEmail)}
                        </div>

                        <ConfigEditor
                          agentId={agent.id}
                          businessName={config.businessName}
                          ownerName={config.ownerName}
                          website={config.website}
                          contactEmail={config.contactEmail}
                          signature={config.signature}
                          startingPrice={
                            (config.pricing as { startingPrice: number }).startingPrice
                          }
                          callWindowStart={
                            (
                              config.businessRules as {
                                callWindow: { start: string };
                              }
                            ).callWindow.start
                          }
                          callWindowEnd={
                            (
                              config.businessRules as {
                                callWindow: { end: string };
                              }
                            ).callWindow.end
                          }
                          callWindowTimezone={
                            (
                              config.businessRules as {
                                callWindow: { timezone: string };
                              }
                            ).callWindow.timezone
                          }
                        />
                      </div>
                    ) : null}

                    <div style={{ display: "grid", gap: 10 }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>Workflow bindings</p>
                      {agent.workflows.map((binding) => (
                        <div
                          key={binding.id}
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 16,
                            padding: 16
                          }}
                        >
                          <p style={{ margin: 0, fontWeight: 700 }}>{binding.workflowKey}</p>
                          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                            Status: {binding.status}
                          </p>
                          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                            n8n workflow ID: {binding.n8nWorkflowId ?? "Not provisioned yet"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {sectionCard(
              "Client Connections",
              <div style={{ display: "grid", gap: 10 }}>
                {integrationsForDisplay.map((integration) => (
                  <div
                    key={integration.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 16,
                      padding: 16,
                      display: "grid",
                      gap: 10
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {getIntegrationLabel(integration.type)}
                    </p>
                    <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                      Status: {integration.status}
                    </p>
                    <p style={{ margin: 0, color: "var(--muted)" }}>
                      Connected account: {integration.accountLabel ?? "No account connected yet"}
                    </p>
                    {integration.status === "ACTIVE" &&
                    getCredentialSyncState(integration.credentialRef) === "fallback" ? (
                      <p style={{ margin: 0, color: "#8a2f2f", fontSize: 13 }}>
                        n8n credential sync is incomplete: saved fallback reference has no n8n
                        credential ID yet.
                      </p>
                    ) : null}
                    <p style={{ margin: 0, color: "var(--muted)" }}>
                      {integration.connectMode === "self_serve"
                        ? "The client connects this in their dashboard. Those credentials are reused when you create the matching channel agent."
                        : "This is completed operator-side later during launch."}
                    </p>
                    {integration.connectMode === "self_serve" ? (
                      <ConnectIntegrationButton
                        tenantSlug={tenant.slug}
                        integrationType={integration.type}
                        compact
                      />
                    ) : null}
                    {integration.isSaved ? (
                      <IntegrationOperatorForm
                        integrationId={integration.id}
                        status={integration.status}
                        accountLabel={integration.accountLabel}
                        credentialRef={integration.credentialRef}
                      />
                    ) : (
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                        No saved connection record yet.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
