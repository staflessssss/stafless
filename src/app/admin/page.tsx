import Link from "next/link";
import { getDashboardTenants } from "@/lib/dashboard";
import { CreateAgentForm, CreateTenantForm } from "./admin-actions";
import { db } from "@/lib/db";

function statCard(label: string, value: string | number) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 20,
        border: "1px solid var(--line)",
        background: "rgba(255,255,255,0.45)"
      }}
    >
      <p
        style={{
          margin: 0,
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: "0.1em",
          color: "var(--muted)"
        }}
      >
        {label}
      </p>
      <p style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const tenants = await getDashboardTenants();
  const templates = await db.agentTemplate.findMany({
    orderBy: {
      createdAt: "asc"
    }
  });

  const agentCount = tenants.reduce((sum, tenant) => sum + tenant.agents.length, 0);
  const integrationCount = tenants.reduce(
    (sum, tenant) => sum + tenant.integrations.length,
    0
  );
  const workflowCount = tenants.reduce(
    (sum, tenant) => sum + tenant.workflowBindings.length,
    0
  );

  return (
    <main style={{ padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: 12,
              color: "var(--muted)"
            }}
          >
            Admin
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 48 }}>Tenant control center</h1>
          <p style={{ margin: 0, fontSize: 18, maxWidth: 760, lineHeight: 1.6 }}>
            This is the first internal dashboard for provisioning and reviewing
            agent tenants. Right now it shows the seeded Myndful Films setup.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28
          }}
        >
          {statCard("Tenants", tenants.length)}
          {statCard("Agents", agentCount)}
          {statCard("Integrations", integrationCount)}
          {statCard("Workflow Bindings", workflowCount)}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            marginBottom: 28
          }}
        >
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 24,
              background: "var(--surface)",
              padding: 24
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 24 }}>Create tenant</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Start a new client workspace without touching the database manually.
            </p>
            <CreateTenantForm />
          </div>

          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 24,
              background: "var(--surface)",
              padding: 24
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 24 }}>Create agent</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Attach a template-driven agent to an existing tenant.
            </p>
            <CreateAgentForm
              tenants={tenants.map((tenant) => ({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug
              }))}
              templates={templates.map((template) => ({
                id: template.id,
                name: template.name,
                niche: template.niche
              }))}
            />
          </div>
        </section>

        <section
          style={{
            border: "1px solid var(--line)",
            borderRadius: 28,
            background: "var(--surface)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 180px",
              gap: 16,
              padding: "18px 24px",
              borderBottom: "1px solid var(--line)",
              color: "var(--muted)",
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase"
            }}
          >
            <span>Tenant</span>
            <span>Status</span>
            <span>Agents</span>
            <span>Integrations</span>
            <span />
          </div>

          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 180px",
                gap: 16,
                padding: "22px 24px",
                alignItems: "center",
                borderBottom: "1px solid var(--line)"
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{tenant.name}</p>
                <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                  `{tenant.slug}` • {tenant.timezone}
                </p>
              </div>
              <div>{tenant.status}</div>
              <div>{tenant.agents.length}</div>
              <div>{tenant.integrations.length}</div>
              <div>
                <Link
                  href={`/admin/tenants/${tenant.slug}`}
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    color: "var(--surface)",
                    background: "var(--accent)",
                    padding: "10px 14px",
                    borderRadius: 999
                  }}
                >
                  Open tenant
                </Link>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
