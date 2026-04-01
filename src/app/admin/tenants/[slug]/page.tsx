import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/dashboard";
import { ConfigEditor } from "./config-editor";
import { ConnectIntegrationButton } from "./connect-integration-button";
import { AgentOperatorPanel } from "./agent-operator-panel";
import { IntegrationOperatorForm } from "./integration-operator-form";

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

export default async function TenantDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const agent = tenant.agents[0];
  const config = agent?.config;

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
            This page shows the tenant-level setup that will eventually drive
            provisioning, dashboard controls, and per-client agent behavior.
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
                {keyValue("Integrations", tenant.integrations.length)}
                {keyValue("Workflow bindings", tenant.workflowBindings.length)}
              </div>
            )}

            {agent &&
              sectionCard(
                "Primary Agent",
                <div>
                  {keyValue("Agent name", agent.name)}
                  {keyValue("Template", agent.template.name)}
                  {keyValue("Niche", agent.template.niche)}
                  {keyValue("Status", agent.status)}
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
              )}

            {agent &&
              sectionCard(
                "Operator Controls",
                <AgentOperatorPanel
                  agentId={agent.id}
                  status={agent.status}
                />
              )}

            {config &&
              sectionCard(
                "Business Configuration",
                <div>
                  {keyValue("Business name", config.businessName)}
                  {keyValue("Owner", config.ownerName)}
                  {keyValue("Website", config.website)}
                  {keyValue("Contact email", config.contactEmail)}
                  {keyValue("Starting price", `$${(config.pricing as { startingPrice: number }).startingPrice}`)}
                  {keyValue(
                    "Call window",
                    `${((config.businessRules as { callWindow: { start: string; end: string; timezone: string } }).callWindow.start)} - ${((config.businessRules as { callWindow: { start: string; end: string; timezone: string } }).callWindow.end)} ${((config.businessRules as { callWindow: { timezone: string } }).callWindow.timezone)}`
                  )}
                </div>
              )}

            {config &&
              sectionCard(
                "Edit Agent Config",
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
              )}
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {sectionCard(
              "Coverage Regions",
              <div style={{ display: "grid", gap: 12 }}>
                {config &&
                  (
                    config.coverageRules as {
                      regions: { code: string; label: string; capacity: number }[];
                    }
                  ).regions.map((region) => (
                    <div
                      key={region.code}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 18,
                        padding: 16
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700 }}>{region.label}</p>
                      <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                        Capacity: {region.capacity}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {sectionCard(
              "Workflow Bindings",
              <div style={{ display: "grid", gap: 10 }}>
                {(agent?.workflows ?? tenant.workflowBindings).map((binding) => (
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
                    {binding.status.includes("needs_connect") ? (
                      <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                        This workflow was created without client credentials and
                        will start working after integrations are connected.
                      </p>
                    ) : null}
                    <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                      n8n workflow ID: {binding.n8nWorkflowId ?? "Not provisioned yet"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {sectionCard(
              "Integrations",
              <div style={{ display: "grid", gap: 10 }}>
                {tenant.integrations.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    No integrations connected yet.
                  </p>
                ) : (
                  tenant.integrations.map((integration) => (
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
                      <p style={{ margin: 0, fontWeight: 700 }}>{integration.type}</p>
                      <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                        Status: {integration.status}
                      </p>
                      <p style={{ margin: 0, color: "var(--muted)" }}>
                        Each tenant should connect their own account. No shared
                        credentials are embedded in newly provisioned workflows.
                      </p>
                      <ConnectIntegrationButton
                        tenantSlug={tenant.slug}
                        integrationType={integration.type}
                        compact
                      />
                      <IntegrationOperatorForm
                        integrationId={integration.id}
                        status={integration.status}
                        accountLabel={integration.accountLabel}
                        credentialRef={integration.credentialRef}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
