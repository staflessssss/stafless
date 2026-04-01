import { getDashboardTenantOr404, renderDashboardPage } from "./helpers";
import { buildActivityFeed, buildBookingSummary, buildConversationFeed, getDisplayIntegrations } from "./presentation";
import { getAgentCreationCheck } from "@/lib/agent-creation-check";

function statCard(label: string, value: string | number, note: string) {
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 24,
        border: "1px solid var(--line)",
        background:
          "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
      }}
    >
      <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 12, color: "var(--muted)" }}>
        {label}
      </p>
      <p style={{ margin: "12px 0 8px", fontSize: 38, fontWeight: 700, color: "var(--text)" }}>{value}</p>
      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{note}</p>
    </div>
  );
}

export default async function TenantDashboardPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getDashboardTenantOr404(slug);
  const agent = tenant.agents[0];
  const templateSlug = agent?.template.slug ?? "wedding-lead-agent";
  const integrations = getDisplayIntegrations(tenant, templateSlug);
  const creationCheck = getAgentCreationCheck(templateSlug, tenant.integrations);
  const conversations = buildConversationFeed(tenant);
  const activity = buildActivityFeed(tenant);
  const bookings = buildBookingSummary(tenant);
  const connectedChannels = integrations.filter((integration) => integration.isConnected).length;
  const hasLiveData = tenant.conversations.length > 0 || tenant.appointments.length > 0;
  const connectedRequiredServices = creationCheck.connectedIntegrationTypes.length;
  const totalRequiredServices = creationCheck.requiredIntegrationTypes.length;

  return renderDashboardPage({
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    title: "Overview",
    description:
      "A premium client view of your channels, conversations, assistant actions, and bookings without any backend noise.",
    active: "overview",
    children: (
      <div style={{ display: "grid", gap: 22 }}>
        <section
          style={{
            border: "1px solid var(--line)",
            borderRadius: 30,
            padding: 24,
            background:
              "radial-gradient(circle at top right, rgba(90,209,138,0.12), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            display: "grid",
            gap: 16
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 12 }}>
                Setup Progress
              </p>
              <h2 style={{ marginTop: 10, fontSize: 32 }}>
                {creationCheck.canCreateAgent
                  ? "Your setup is ready for agent creation"
                  : "Finish your connections to unlock launch prep"}
              </h2>
            </div>
            <strong style={{ fontSize: 22, color: "var(--text)" }}>
              {connectedRequiredServices}/{totalRequiredServices} required services connected
            </strong>
          </div>

          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            {creationCheck.canCreateAgent
              ? "Your operator can now create your dedicated workflow set and continue with final review."
              : `Still needed before agent creation: ${creationCheck.missingIntegrationLabels.join(", ")}.`}
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14
          }}
        >
          {statCard("Assistant", agent?.name ?? "Preparing", agent ? "Watching for new inquiries and keeping follow-up moving." : "Your assistant will appear here as setup completes.")}
          {statCard("Channels", connectedChannels, `${integrations.length} client-facing channels available`)}
          {statCard("Conversations", tenant.conversations.length || conversations.length, hasLiveData ? "Live conversations currently in your dashboard." : "A warm demo preview is shown until the first live messages arrive.")}
          {statCard("Bookings", tenant.appointments.length || 0, "Confirmed consultation calls and upcoming bookings.")}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)",
            gap: 18
          }}
        >
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 30,
              padding: 24,
              background:
                "radial-gradient(circle at top right, rgba(255,111,97,0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              display: "grid",
              gap: 18
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 12 }}>
                  Client Snapshot
                </p>
                <h2 style={{ marginTop: 10, fontSize: 32 }}>
                  {hasLiveData ? "Live assistant flow" : "Ready for first live conversation"}
                </h2>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--line)",
                  color: "var(--text)"
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: connectedChannels > 0 ? "#5ad18a" : "#f6be3a",
                    boxShadow: connectedChannels > 0
                      ? "0 0 0 6px rgba(90,209,138,0.18)"
                      : "0 0 0 6px rgba(246,190,58,0.16)"
                  }}
                />
                {connectedChannels > 0 ? "Ready" : "Connect channels"}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: "var(--text)" }}>
              {hasLiveData
                ? "Your dashboard is already showing real client activity, assistant replies, and booked moments."
                : "As soon as you connect Gmail or Instagram, this space turns into your clean live operating view."}
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              {conversations.slice(0, 2).map((conversation) => (
                <div
                  key={conversation.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 20,
                    padding: 16,
                    background: conversation.isDemo ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--text)" }}>{conversation.title}</strong>
                    <span style={{ color: "var(--muted)" }}>{conversation.channel}</span>
                  </div>
                  <p style={{ marginTop: 10, color: "var(--text)", lineHeight: 1.6 }}>{conversation.preview}</p>
                  <p style={{ marginTop: 10, color: "var(--muted)" }}>{conversation.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 30,
              padding: 24,
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              display: "grid",
              gap: 12
            }}
          >
            <h2 style={{ fontSize: 30 }}>Upcoming bookings</h2>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 16,
                  background: "rgba(255,255,255,0.04)"
                }}
              >
                <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{booking.title}</p>
                <p style={{ marginTop: 8, color: "var(--muted)" }}>{booking.startsAt}</p>
                <p style={{ marginTop: 8, color: "var(--text)" }}>{booking.status}</p>
              </div>
            ))}

            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 18,
                padding: 16,
                background: "rgba(255,255,255,0.03)"
              }}
            >
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
                The client-facing dashboard only shows the moments that matter: channels, conversations, assistant actions, and bookings.
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16
          }}
        >
          {activity.slice(0, 3).map((item) => (
            <article
              key={item.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 24,
                padding: 18,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
              }}
            >
              <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{item.label}</p>
              <p style={{ marginTop: 8, color: "var(--muted)" }}>{item.channel}</p>
              <p style={{ marginTop: 12, color: "var(--text-soft)", lineHeight: 1.7 }}>{item.details}</p>
            </article>
          ))}
        </section>
      </div>
    )
  });
}
