/**
 * Removes any "Recorded" delivery-mode courses from the live `upcoming_courses`
 * CMS row (left over from before recorded sessions were dropped from the site).
 * Safe to run repeatedly — it only rewrites the row if something changed.
 *
 * Run from backend: node --env-file=.env strip-recorded-courses.mjs
 */
import "./src/ensure-database-url.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const row = await prisma.siteContent.findUnique({
    where: { sectionKey: "upcoming_courses" },
  });

  if (!row?.data || typeof row.data !== "object" || Array.isArray(row.data)) {
    console.log("No upcoming_courses row to clean — nothing to do.");
  } else {
    const data = row.data;
    const courses = Array.isArray(data.courses) ? data.courses : [];
    const cleaned = courses.filter(
      (c) => String(c?.mode ?? "").toLowerCase() !== "recorded",
    );
    const removed = courses.length - cleaned.length;

    if (removed === 0) {
      console.log("No 'Recorded' courses found — nothing to remove.");
    } else {
      await prisma.siteContent.update({
        where: { sectionKey: "upcoming_courses" },
        data: { data: { ...data, courses: cleaned } },
      });
      console.log(`OK: removed ${removed} 'Recorded' course(s) from upcoming_courses.`);
    }
  }
} finally {
  await prisma.$disconnect();
}
