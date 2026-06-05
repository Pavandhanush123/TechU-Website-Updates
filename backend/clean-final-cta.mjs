/**
 * Removes the retired `eyebrow`, `secondaryLabel` and `secondaryHref` fields
 * from the live `final_cta` CMS row (the "Talk to a Mentor" button + eyebrow
 * were dropped in the redesign). Safe to run repeatedly.
 *
 * Run from backend: node --env-file=.env clean-final-cta.mjs
 */
import "./src/ensure-database-url.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DROP = ["eyebrow", "secondaryLabel", "secondaryHref"];

try {
  const row = await prisma.siteContent.findUnique({
    where: { sectionKey: "final_cta" },
  });

  if (!row?.data || typeof row.data !== "object" || Array.isArray(row.data)) {
    console.log("No final_cta row to clean — defaults already updated.");
  } else {
    const data = { ...row.data };
    const removed = DROP.filter((k) => k in data);
    removed.forEach((k) => delete data[k]);

    if (removed.length === 0) {
      console.log("final_cta already clean — nothing to remove.");
    } else {
      await prisma.siteContent.update({
        where: { sectionKey: "final_cta" },
        data: { data },
      });
      console.log(`OK: removed ${removed.join(", ")} from final_cta.`);
    }
  }
} finally {
  await prisma.$disconnect();
}
