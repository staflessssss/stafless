import { ConfigEditor } from "@/app/admin/tenants/[slug]/config-editor";
import { getDashboardTenantOr404, renderDashboardPage } from "../helpers";

export default async function TenantSettingsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getDashboardTenantOr404(slug);
  const agent = tenant.agents[0];
  const config = agent?.config;

  return renderDashboardPage({
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    title: "Business Settings",
    description: "Keep your business details up to date so replies and booking messages stay accurate.",
    active: "settings",
    children: config && agent ? (
      <div style={{ display: "grid", gap: 20 }}>
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: 18,
            background: "rgba(255,255,255,0.45)"
          }}
        >
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Changes here update the information your assistant uses in replies, availability checks, and booking messages.
          </p>
        </div>

        <ConfigEditor
          agentId={agent.id}
          businessName={config.businessName}
          ownerName={config.ownerName}
          website={config.website}
          contactEmail={config.contactEmail}
          signature={config.signature}
          startingPrice={(config.pricing as { startingPrice: number }).startingPrice}
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
    ) : (
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Your business settings are not ready yet.
      </p>
    )
  });
}
