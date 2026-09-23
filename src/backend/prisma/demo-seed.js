import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const acme = await prisma.company.findUnique({
    where: { id: "cmteneo6f000078rrybprgamp" },
  });

  const sakura = await prisma.company.findUnique({
    where: { id: "cmtm5h19r0000chrry7islpnq" },
  });

  const jiro = await prisma.user.findUnique({
    where: { id: "cmth1l5x60000xmrrmgb4a397" },
  });

  const jason = await prisma.user.findUnique({
    where: { id: "cmtm2kp4d0000ihrrhv55n0bi" },
  });

  if (!acme || !sakura || !jiro || !jason) {
    throw new Error("Required company/user records were not found.");
  }

  const stages = {};
  for (const name of [
    "Lead",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
  ]) {
    const stage = await prisma.dealStage.findFirst({
      where: { name },
    });

    if (!stage) {
      throw new Error(`Deal stage not found: ${name}`);
    }

    stages[name] = stage;
  }

  // ------------------------------------------------------------
  // Sakura contacts
  // ------------------------------------------------------------

  const contacts = [
    {
      firstName: "Kenji",
      lastName: "Sato",
      email: "kenji.sato@sakura-precision.example",
      phone: "+81 90 1234 5678",
    },
    {
      firstName: "Yuki",
      lastName: "Tanaka",
      email: "yuki.tanaka@sakura-precision.example",
      phone: "+81 80 2345 6789",
    },
    {
      firstName: "Hiroshi",
      lastName: "Mori",
      email: "hiroshi.mori@sakura-precision.example",
      phone: "+81 70 3456 7890",
    },
  ];

  const contactRecords = {};
  for (const contact of contacts) {

  const existing = await prisma.contact.findFirst({
  where: {
    email: contact.email,
    companyId: sakura.id,
  },
});
const record = existing
  ? await prisma.contact.update({
      where: { id: existing.id },
      data: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
      },
    })
  : await prisma.contact.create({
      data: {
        ...contact,
        companyId: sakura.id,
      },
    });
    contactRecords[contact.email] = record;
  }

  // ------------------------------------------------------------
  // Demo deals
  // ------------------------------------------------------------

  const deals = [
    {
      key: "enterprise-analytics",
      title: "Enterprise Analytics Platform",
      description:
        "Enterprise analytics implementation covering reporting, dashboards, and operational visibility.",
      companyId: acme.id,
      stage: "Qualified",
      ownerId: jason.id,
      amount: 6800000,
      contactId: "cmteq0iy300000irriaq6n6g3",
      reviewStatus: "IN_REVIEW",
      estimatedCost: 3900000,
      expectedProfit: 2900000,
      expectedMargin: 42.65,
      customerTargetPrice: 6200000,
      minimumPrice: 6100000,
      currentOffer: 6400000,
      negotiationNotes:
        "Customer is reviewing implementation scope and reporting requirements.",
      riskNotes:
        "Integration effort may increase if legacy reporting systems require additional migration work.",
    },
    {
      key: "manufacturing-automation",
      title: "Manufacturing Automation",
      description:
        "Factory automation and production workflow modernization project.",
      companyId: acme.id,
      stage: "Proposal",
      ownerId: jiro.id,
      amount: 11500000,
      contactId: "cmteq0iy300000irriaq6n6g3",
      reviewStatus: "COMPLETED",
      estimatedCost: 6900000,
      expectedProfit: 4600000,
      expectedMargin: 40,
      customerTargetPrice: 10800000,
      minimumPrice: 10100000,
      currentOffer: 11000000,
      negotiationNotes:
        "Proposal submitted. Commercial discussion is focused on implementation phases.",
      riskNotes:
        "Timeline depends on factory access and equipment availability.",
    },
    {
      key: "factory-automation-upgrade",
      title: "Factory Automation Upgrade",
      description:
        "Automation upgrade for Sakura Precision Systems production operations.",
      companyId: sakura.id,
      stage: "Proposal",
      ownerId: jason.id,
      amount: 8500000,
      contactId: contactRecords["kenji.sato@sakura-precision.example"].id,
      reviewStatus: "IN_REVIEW",
      estimatedCost: 5100000,
      expectedProfit: 3400000,
      expectedMargin: 40,
      customerTargetPrice: 8200000,
      minimumPrice: 7800000,
      currentOffer: 8300000,
      negotiationNotes:
        "Customer is evaluating the proposed automation scope and implementation schedule.",
      riskNotes:
        "Production downtime requirements could affect project timing.",
    },
    {
      key: "production-line-monitoring",
      title: "Production Line Monitoring",
      description:
        "Real-time production monitoring and operational reporting solution.",
      companyId: sakura.id,
      stage: "Qualified",
      ownerId: jason.id,
      amount: 4200000,
      contactId: contactRecords["yuki.tanaka@sakura-precision.example"].id,
      reviewStatus: "NOT_STARTED",
      estimatedCost: 2500000,
      expectedProfit: 1700000,
      expectedMargin: 40.48,
      customerTargetPrice: 4000000,
      minimumPrice: 3800000,
      currentOffer: 4000000,
      negotiationNotes:
        "Initial requirements gathered. Technical discovery is pending.",
      riskNotes:
        "Existing factory network infrastructure needs to be assessed.",
    },
    {
      key: "iot-equipment-integration",
      title: "IoT Equipment Integration",
      description:
        "Integration of industrial equipment with centralized IoT monitoring.",
      companyId: sakura.id,
      stage: "Negotiation",
      ownerId: jiro.id,
      amount: 12800000,
      contactId: contactRecords["hiroshi.mori@sakura-precision.example"].id,
      reviewStatus: "IN_REVIEW",
      estimatedCost: 7700000,
      expectedProfit: 5100000,
      expectedMargin: 39.84,
      customerTargetPrice: 12200000,
      minimumPrice: 11600000,
      currentOffer: 12400000,
      negotiationNotes:
        "Commercial negotiation is underway around deployment scope and support coverage.",
      riskNotes:
        "Third-party equipment compatibility is the primary technical risk.",
    },
    {
      key: "maintenance-support",
      title: "Maintenance & Support Contract",
      description:
        "Annual maintenance and technical support agreement.",
      companyId: sakura.id,
      stage: "Won",
      ownerId: jiro.id,
      amount: 2400000,
      contactId: contactRecords["kenji.sato@sakura-precision.example"].id,
      reviewStatus: "COMPLETED",
      estimatedCost: 1300000,
      expectedProfit: 1100000,
      expectedMargin: 45.83,
      customerTargetPrice: 2400000,
      minimumPrice: 2200000,
      currentOffer: 2400000,
      negotiationNotes:
        "Annual support agreement successfully closed.",
      riskNotes:
        "Renewal depends on service performance and response times.",
    },
  ];

  for (const item of deals) {
    const existing = await prisma.deal.findFirst({
      where: {
        title: item.title,
        companyId: item.companyId,
      },
    });

    if (existing) {
      console.log(`Skipping existing deal: ${item.title}`);
      continue;
    }

    const deal = await prisma.deal.create({
      data: {
        title: item.title,
        description: item.description,
        companyId: item.companyId,
        contactId: item.contactId,
        stageId: stages[item.stage].id,
        ownerId: item.ownerId,
        amount: item.amount,
        currency: "JPY",
        status: item.stage === "Won" ? "WON" : "ACTIVE",
        review: {
          create: {
            status: item.reviewStatus,
            estimatedCost: item.estimatedCost,
            expectedProfit: item.expectedProfit,
            expectedMargin: item.expectedMargin,
            customerTargetPrice: item.customerTargetPrice,
            minimumPrice: item.minimumPrice,
            currentOffer: item.currentOffer,
            negotiationNotes: item.negotiationNotes,
            riskNotes: item.riskNotes,
          },
        },
      },
      include: {
        company: true,
        stage: true,
        owner: true,
        contact: true,
        review: true,
      },
    });

    console.log(
      `Created: ${deal.title} — ${deal.currency} ${deal.amount}`
    );
  }

  console.log("");
  console.log("Demo data import complete.");
}


main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

