/**
 * One-off cleanup: deletes legacy application leads whose `course` text still
 * carries the now-removed "Passout Year: …" suffix. Safe to run repeatedly.
 *
 * Run from backend: node --env-file=.env delete-passout-year-leads.mjs
 */
import "./src/ensure-database-url.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const matches = await prisma.demoRequest.findMany({
    where: { course: { contains: "Passout Year" } },
    select: { id: true, course: true },
  });

  if (matches.length === 0) {
    console.log("No leads with 'Passout Year' found — nothing to delete.");
  } else {
    const result = await prisma.demoRequest.deleteMany({
      where: { course: { contains: "Passout Year" } },
    });
    console.log(`OK: deleted ${result.count} lead(s) containing 'Passout Year'.`);
  }
} finally {
  await prisma.$disconnect();
}
