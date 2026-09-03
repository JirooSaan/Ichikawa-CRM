import "dotenv/config";
import prisma from "../src/lib/prisma.js";

const stages = [
  {
    name: "Lead",
    order: 1,
    description: "New potential opportunity",
  },
  {
    name: "Qualified",
    order: 2,
    description: "Opportunity has been qualified",
  },
  {
    name: "Proposal",
    order: 3,
    description: "Proposal or quotation has been submitted",
  },
  {
    name: "Negotiation",
    order: 4,
    description: "Commercial or technical terms are being negotiated",
  },
  {
    name: "Won",
    order: 5,
    description: "Deal has been successfully closed",
  },
  {
    name: "Lost",
    order: 6,
    description: "Deal was not successfully closed",
  },
];

async function main() {
  for (const stage of stages) {
    await prisma.dealStage.upsert({
      where: {
        order: stage.order,
      },
      update: {
        name: stage.name,
        description: stage.description,
      },
      create: stage,
    });
  }

  console.log("Deal stages seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
