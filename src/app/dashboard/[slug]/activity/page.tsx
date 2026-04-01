import { getDashboardTenantOr404, renderDashboardPage } from "../helpers";
import { buildActivityFeed } from "../presentation";

export default async function TenantActivityPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getDashboardTenantOr404(slug);
  const activity = buildActivityFeed(tenant);

  return renderDashboardPage({
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    title: "Assistant Activity",
    description: "A clear timeline of what your assistant has already handled for you, without showing backend workflow details.",
    active: "activity",
    children: (
      <div style={{ display: "grid", gap: 14 }}>
        {activity.map((item) => (
          <article
            key={item.id}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 24,
              padding: 18,
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap"
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", fontSize: 18 }}>{item.label}</p>
                <p style={{ marginTop: 6, color: "var(--muted)" }}>{item.channel}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, color: "var(--text)", fontWeight: 700 }}>{item.status}</p>
                <p style={{ marginTop: 6, color: "var(--muted)" }}>{item.createdAt}</p>
              </div>
            </div>
            <p style={{ marginTop: 14, color: "var(--text-soft)", lineHeight: 1.7 }}>{item.details}</p>
          </article>
        ))}
      </div>
    )
  });
}
