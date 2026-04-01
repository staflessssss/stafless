import { PrismaClient } from "@prisma/client";
import { myndfulConfig } from "../src/lib/myndful-config";
import { hashPassword } from "../src/lib/password";
import { weddingLeadAgentBasePrompt } from "../src/lib/prompt-templates";

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.agentTemplate.upsert({
    where: { slug: "wedding-lead-agent" },
    update: {},
    create: {
      name: "Wedding Lead Agent",
      slug: "wedding-lead-agent",
      niche: "wedding",
      basePrompt: weddingLeadAgentBasePrompt,
      defaultTools: ["check_availability", "check_calendar", "book_call"],
      defaultChannels: ["gmail"],
      workflowTemplateMap: {}
    }
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "myndful-films" },
    update: {},
    create: {
      name: "Myndful Films",
      slug: "myndful-films",
      timezone: "America/New_York",
      status: "ACTIVE"
    }
  });

  const agent = await prisma.agent.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "Taras Sales Agent"
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      templateId: template.id,
      name: "Taras Sales Agent",
      status: "ACTIVE"
    }
  });

  await prisma.agentConfig.upsert({
    where: { agentId: agent.id },
    update: {
      businessName: myndfulConfig.businessName,
      ownerName: myndfulConfig.ownerName,
      website: myndfulConfig.website,
      contactEmail: myndfulConfig.contactEmail,
      signature: myndfulConfig.signature,
      brandVoice: myndfulConfig.brandVoice,
      businessRules: myndfulConfig.businessRules,
      coverageRules: myndfulConfig.coverageRules,
      pricing: myndfulConfig.pricing,
      faq: myndfulConfig.faq,
      portfolioLinks: myndfulConfig.portfolioLinks,
      reviewsLink: myndfulConfig.reviewsLink
    },
    create: {
      agentId: agent.id,
      businessName: myndfulConfig.businessName,
      ownerName: myndfulConfig.ownerName,
      website: myndfulConfig.website,
      contactEmail: myndfulConfig.contactEmail,
      signature: myndfulConfig.signature,
      brandVoice: myndfulConfig.brandVoice,
      businessRules: myndfulConfig.businessRules,
      coverageRules: myndfulConfig.coverageRules,
      pricing: myndfulConfig.pricing,
      faq: myndfulConfig.faq,
      portfolioLinks: myndfulConfig.portfolioLinks,
      reviewsLink: myndfulConfig.reviewsLink
    }
  });

  await prisma.tenantUser.upsert({
    where: {
      email: "client@myndfulfilms.com"
    },
    update: {
      tenantId: tenant.id,
      fullName: "Myndful Films Client",
      passwordHash: hashPassword("stafless-demo"),
      status: "ACTIVE"
    },
    create: {
      tenantId: tenant.id,
      email: "client@myndfulfilms.com",
      fullName: "Myndful Films Client",
      passwordHash: hashPassword("stafless-demo"),
      status: "ACTIVE"
    }
  });

  console.log("Seeded Myndful Films tenant:", tenant.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
