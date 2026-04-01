import Link from "next/link";
import { notFound } from "next/navigation";
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

  const agent = tenant.agents[0];
  const config = agent?.config;
  const selectedTemplate = agent?.template ?? templates[0] ?? null;
  const creationCheck = selectedTemplate
    ? getAgentCreationCheck(selectedTemplate.slug, tenant.integrations)
    : null;
  const launchCheck =
    agent
      ? getAgentLaunchCheck({
          status: agent.status,
          template: agent.template,
          config: agent.config,
          integrations: tenant.integrations,
          workflows: agent.workflows
        })
      : null;
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
      connectedAt: integration?.connectedAt ?? null,
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
            This page is the operator view for one client: first confirm their
            connected services, then create their dedicated workflow set, then clear
            the final launch checklist.
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
              "Operator Summary",
              <div style={{ display: "grid", gap: 16 }}>
                <div
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    border: "1px solid var(--line)",
                    background:
                      agent && launchCheck
                        ? launchCheck.canLaunch
                          ? "rgba(62,107,55,0.08)"
                          : "rgba(246,190,58,0.12)"
                        : creationCheck?.canCreateAgent
                          ? "rgba(62,107,55,0.08)"
                          : "rgba(138,47,47,0.08)"
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {agent && launchCheck
                      ? launchCheck.canLaunch
                        ? "Agent exists and looks ready for final review."
                        : "Agent exists, but there are still launch blockers to clear."
                      : creationCheck?.canCreateAgent
                        ? "Client setup is ready. You can create this tenant's dedicated workflow set now."
                        : "Client setup is still incomplete, so agent creation stays blocked for now."}
                  </p>
                  <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                    {agent && launchCheck
                      ? `Current launch stage: ${launchCheck.stage}`
                      : selectedTemplate
                        ? `Checking readiness against template: ${selectedTemplate.name}`
                        : "No template selected yet."}
                  </p>
                </div>

                {!agent && creationCheck ? (
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Before agent creation</p>
                    {creationCheck.missingIntegrationLabels.length === 0 ? (
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        All required client connections are already in place.
                      </p>
                    ) : (
                      <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "var(--muted)" }}>
                        {creationCheck.missingIntegrationLabels.map((item) => (
                          <li key={item} style={{ marginTop: 8 }}>
                            {item} still needs to be connected by the client.
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}

                {agent && launchCheck ? (
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Before activation</p>
                    {launchCheck.blockingItems.length === 0 ? (
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        No launch blockers found.
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
                ) : null}
              </div>
            )}

            {!agent &&
              sectionCard(
                "Create Agent",
                !selectedTemplate ? (
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    No templates are available yet.
                  </p>
                ) : !creationCheck?.canCreateAgent ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
                      Agent creation unlocks only after the client has connected the
                      required services for this template.
                    </p>
                    <p style={{ margin: 0, color: "var(--muted)" }}>
                      Still missing: {creationCheck?.missingIntegrationLabels.join(", ")}.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
                      This creates a dedicated workflow set for {tenant.name} and
                      uses the credentials the client already connected in their own
                      dashboard.
                    </p>
                    <TenantCreateAgentForm
                      tenantId={tenant.id}
                      tenantName={tenant.name}
                      templates={templates.map((template) => ({
                        id: template.id,
                        name: template.name,
                        niche: template.niche
                      }))}
                    />
                  </div>
                )
              )}

            {agent &&
              sectionCard(
                "Primary Agent",
                <div>
                  {keyValue("Agent name", agent.name)}
                  {keyValue("Template", agent.template.name)}
                  {keyValue("Niche", agent.template.niche)}
                  {keyValue("Status", agent.status)}
                  {launchCheck && keyValue("Launch stage", launchCheck.stage)}
                  {launchCheck &&
                    keyValue(
                      "Ready to launch",
                      launchCheck.canLaunch ? "Yes" : "Not yet"
                    )}
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
              launchCheck &&
              sectionCard(
                "Launch Checklist",
                <div style={{ display: "grid", gap: 16 }}>
                  <div
                    style={{
                      borderRadius: 18,
                      padding: 16,
                      border: "1px solid var(--line)",
                      background: launchCheck.canLaunch
                        ? "rgba(62,107,55,0.08)"
                        : "rgba(138,47,47,0.08)"
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {launchCheck.canLaunch
                        ? "This agent looks ready for final review and launch."
                        : "This agent still has setup work left before launch."}
                    </p>
                    <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                      Current stage: {launchCheck.stage}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>What still needs attention</p>
                    {launchCheck.blockingItems.length === 0 ? (
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        No blocking issues found.
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

                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Notes</p>
                    {launchCheck.notes.length === 0 ? (
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        No extra notes right now.
                      </p>
                    ) : (
                      <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "var(--muted)" }}>
                        {launchCheck.notes.map((item) => (
                          <li key={item} style={{ marginTop: 8 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

            {agent &&
              sectionCard(
                "Operator Controls",
                <AgentOperatorPanel
                  agentId={agent.id}
                  status={agent.status}
                  canActivate={launchCheck?.canLaunch ?? false}
                  activateMessage={
                    launchCheck?.canLaunch
                      ? undefined
                      : "Activation stays locked until the launch checklist is clear."
                  }
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
                  {keyValue(
                    "Starting price",
                    `$${(config.pricing as { startingPrice: number }).startingPrice}`
                  )}
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
                {(agent?.workflows ?? tenant.workflowBindings).length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    No workflows created for this tenant yet.
                  </p>
                ) : (
                  (agent?.workflows ?? tenant.workflowBindings).map((binding) => (
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
                  ))
                )}
              </div>
            )}

            {sectionCard(
              "Integrations",
              <div style={{ display: "grid", gap: 10 }}>
                {integrationsForDisplay.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    No integrations connected yet.
                  </p>
                ) : (
                  integrationsForDisplay.map((integration) => (
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
                        {integration.connectMode === "self_serve"
                          ? "The client can connect this directly in their dashboard. Those credentials are then used when you create their dedicated workflows."
                          : "This connection is handled from the operator side during launch and support setup."}
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
