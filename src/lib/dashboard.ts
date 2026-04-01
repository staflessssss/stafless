import { db } from "@/lib/db";

export async function getDashboardTenants() {
  return db.tenant.findMany({
    include: {
      agents: {
        include: {
          config: true,
          toolConfigs: true
        }
      },
      integrations: true,
      workflowBindings: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function getTenantBySlug(slug: string) {
  return db.tenant.findUnique({
    where: { slug },
    include: {
      agents: {
        include: {
          template: true,
          config: true,
          toolConfigs: true,
          workflows: {
            orderBy: {
              updatedAt: "desc"
            }
          }
        }
      },
      integrations: true,
      workflowBindings: true,
      conversations: {
        include: {
          messages: {
            orderBy: {
              createdAt: "desc"
            },
            take: 5
          },
          toolRuns: {
            orderBy: {
              createdAt: "desc"
            },
            take: 10
          },
          lead: true
        },
        orderBy: [
          {
            lastMessageAt: "desc"
          },
          {
            updatedAt: "desc"
          }
        ],
        take: 25
      },
      leads: {
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      },
      appointments: {
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      }
    }
  });
}
