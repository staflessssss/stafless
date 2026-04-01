import { ConnectIntegrationButton } from "@/app/admin/tenants/[slug]/connect-integration-button";
import { renderDashboardPage, getDashboardTenantOr404 } from "../helpers";
import { formatFriendlyDate, getDisplayIntegrations } from "../presentation";
import { getAgentCreationCheck } from "@/lib/agent-creation-check";

function banner(message: string, tone: "success" | "warning") {
  return (
    <section
      style={{
        border: `1px solid ${tone === "success" ? "rgba(90,209,138,0.28)" : "rgba(255,193,130,0.28)"}`,
        borderRadius: 24,
        padding: "16px 18px",
        background:
          tone === "success"
            ? "linear-gradient(180deg, rgba(90,209,138,0.12), rgba(255,255,255,0.03))"
            : "linear-gradient(180deg, rgba(246,190,58,0.12), rgba(255,255,255,0.03))"
      }}
    >
      <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.7 }}>{message}</p>
    </section>
  );
}

export default async function TenantIntegrationsPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const tenant = await getDashboardTenantOr404(slug);
  const templateSlug = tenant.agents[0]?.template.slug ?? "wedding-lead-agent";
  const integrations = getDisplayIntegrations(tenant, templateSlug);
  const creationCheck = getAgentCreationCheck(templateSlug, tenant.integrations);

  return renderDashboardPage({
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    title: "Channels",
    description:
      "Connect the places where new inquiries arrive so your assistant can reply, follow up, and keep bookings moving.",
    active: "integrations",
    children: (
      <div style={{ display: "grid", gap: 18 }}>
        {query.connected
          ? banner("Your channel was connected successfully and is now ready for live conversations.", "success")
          : null}
        {query.error ? banner(query.error, "warning") : null}
        {banner(
          creationCheck.canCreateAgent
            ? "Your required client connections are ready. Your operator can now create your dedicated assistant workflows and continue with launch review."
            : `Finish these required connections first: ${creationCheck.missingIntegrationLabels.join(", ")}.`,
          creationCheck.canCreateAgent ? "success" : "warning"
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16
          }}
        >
          {integrations.map((integration) => (
            <article
              key={integration.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 30,
                padding: 22,
                background:
                  "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                display: "grid",
                gap: 16
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start"
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 20,
                    display: "grid",
                    placeItems: "center",
                    background: integration.gradient,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 22
                  }}
                >
                  {integration.label.slice(0, 1)}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--line)"
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: integration.isConnected ? "#5ad18a" : "#f6be3a",
                      boxShadow: integration.isConnected
                        ? "0 0 0 6px rgba(90,209,138,0.18)"
                        : "0 0 0 6px rgba(246,190,58,0.16)"
                    }}
                  />
                  <strong style={{ color: "var(--text)" }}>{integration.statusLabel}</strong>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <h3 style={{ fontSize: 26 }}>{integration.label}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{integration.description}</p>
                <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                  {integration.setupHint}
                </p>
              </div>

              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 20,
                  padding: 16,
                  background: "rgba(255,255,255,0.04)",
                  display: "grid",
                  gap: 8
                }}
              >
                <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>
                  Account
                </p>
                <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>
                  {integration.accountLabel ?? "No account connected yet"}
                </p>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {integration.connectedAt
                    ? `Connected ${formatFriendlyDate(integration.connectedAt)}`
                    : "Once connected, new client conversations will start showing up automatically."}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {integration.connectMode === "self_serve" ? (
                  <ConnectIntegrationButton
                    tenantSlug={tenant.slug}
                    integrationType={integration.type}
                    ctaLabel={integration.ctaLabel}
                    connected={integration.isConnected}
                  />
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--line)",
                      color: "var(--text)"
                    }}
                  >
                    {integration.ctaLabel}
                  </span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--line)",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--muted)"
                  }}
                >
                  {integration.connectMode === "self_serve"
                    ? "Secure OAuth"
                    : "Operator-assisted"}
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    )
  });
}
