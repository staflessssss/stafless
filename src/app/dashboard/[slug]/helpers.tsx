import { notFound } from "next/navigation";
import { requireTenantAccess } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/dashboard";
import { DashboardShell } from "./dashboard-shell";

export async function getDashboardTenantOr404(slug: string) {
  await requireTenantAccess(slug);
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  return tenant;
}

export function renderDashboardPage(props: {
  tenantName: string;
  tenantSlug: string;
  title: string;
  description: string;
  active: "overview" | "conversations" | "activity" | "integrations" | "settings";
  children: React.ReactNode;
}) {
  const nav = [
    {
      href: `/dashboard/${props.tenantSlug}`,
      label: "Overview",
      active: props.active === "overview"
    },
    {
      href: `/dashboard/${props.tenantSlug}/conversations`,
      label: "Conversations",
      active: props.active === "conversations"
    },
    {
      href: `/dashboard/${props.tenantSlug}/activity`,
      label: "Activity",
      active: props.active === "activity"
    },
    {
      href: `/dashboard/${props.tenantSlug}/integrations`,
      label: "Integrations",
      active: props.active === "integrations"
    },
    {
      href: `/dashboard/${props.tenantSlug}/settings`,
      label: "Business Settings",
      active: props.active === "settings"
    }
  ];

  return (
    <DashboardShell
      tenantName={props.tenantName}
      tenantSlug={props.tenantSlug}
      title={props.title}
      description={props.description}
      nav={nav}
    >
      {props.children}
    </DashboardShell>
  );
}
