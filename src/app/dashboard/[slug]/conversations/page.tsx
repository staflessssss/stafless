import { getDashboardTenantOr404, renderDashboardPage } from "../helpers";
import { buildConversationFeed } from "../presentation";

export default async function TenantConversationsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getDashboardTenantOr404(slug);
  const conversations = buildConversationFeed(tenant);

  return renderDashboardPage({
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    title: "Conversations",
    description: "A single, polished inbox for the conversations your assistant is handling across every connected channel.",
    active: "conversations",
    children: (
      <div style={{ display: "grid", gap: 16 }}>
        {conversations.map((conversation) => (
          <article
            key={conversation.id}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 28,
              padding: 22,
              background:
                "radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              display: "grid",
              gap: 16
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                alignItems: "flex-start",
                flexWrap: "wrap"
              }}
            >
              <div>
                <p style={{ margin: 0, color: "var(--text)", fontWeight: 700, fontSize: 20 }}>{conversation.title}</p>
                <p style={{ marginTop: 8, color: "var(--muted)" }}>
                  {conversation.channel} • {conversation.stage}
                </p>
              </div>
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  background: conversation.isDemo ? "rgba(255,193,130,0.08)" : "rgba(255,255,255,0.04)",
                  color: conversation.isDemo ? "#ffe1b3" : "var(--muted)"
                }}
              >
                {conversation.lastActivity}
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line)"
              }}
            >
              <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.8 }}>{conversation.preview}</p>
            </div>

            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>{conversation.summary}</p>
          </article>
        ))}
      </div>
    )
  });
}
