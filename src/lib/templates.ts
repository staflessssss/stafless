import type { Prisma } from "@prisma/client";

type AgentTemplateDefaults = {
  businessName: string;
  ownerName: string;
  website: string;
  contactEmail: string;
  signature: string;
  brandVoice: Prisma.InputJsonValue;
  businessRules: Prisma.InputJsonValue;
  coverageRules: Prisma.InputJsonValue;
  pricing: Prisma.InputJsonValue;
  faq: Prisma.InputJsonValue;
  portfolioLinks: Prisma.InputJsonValue;
  reviewsLink: string | null;
};

export function buildDefaultAgentConfig(params: {
  tenantName: string;
  templateSlug: string;
}): AgentTemplateDefaults {
  if (params.templateSlug === "wedding-lead-agent") {
    return {
      businessName: params.tenantName,
      ownerName: "Owner Name",
      website: "",
      contactEmail: "owner@example.com",
      signature: `${params.tenantName}\nFounder\nowner@example.com`,
      brandVoice: {
        style: "warm, personal, founder-led",
        emojiAllowlist: ["🤍", "✨", "🎥"],
        messageStyle: "short natural paragraphs",
        mirrorCustomerTone: true
      },
      businessRules: {
        goal: "book_consultation_call",
        weddingDateMustBeFuture: true,
        callWindow: {
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          start: "09:00",
          end: "14:00",
          timezone: "America/New_York"
        },
        callDurationMinutes: 30,
        requireCheckCalendarBeforeBooking: true,
        requireCheckAvailabilityBeforeConfirmingDate: true,
        neverDiscussContracts: true,
        neverOfferDiscounts: true
      },
      coverageRules: {
        regions: []
      },
      pricing: {
        startingPrice: 0,
        currency: "USD",
        collectionsGuideLabel: "collections guide"
      },
      faq: {},
      portfolioLinks: [],
      reviewsLink: null
    };
  }

  return {
    businessName: params.tenantName,
    ownerName: "Owner Name",
    website: "",
    contactEmail: "owner@example.com",
    signature: `${params.tenantName}\nFounder\nowner@example.com`,
    brandVoice: {
      style: "clear and helpful",
      emojiAllowlist: [],
      messageStyle: "concise",
      mirrorCustomerTone: true
    },
    businessRules: {
      goal: "qualify_lead",
      callWindow: {
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        start: "09:00",
        end: "17:00",
        timezone: "America/New_York"
      }
    },
    coverageRules: {
      regions: []
    },
    pricing: {
      startingPrice: 0,
      currency: "USD"
    },
    faq: {},
    portfolioLinks: [],
    reviewsLink: null
  };
}
