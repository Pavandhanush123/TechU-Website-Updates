/**
 * Ensures every testimonial (Success Story) item in the live `testimonials`
 * CMS row has `lpa` and `avatar` fields, so the admin editor surfaces them.
 * Existing values are left untouched. Safe to run repeatedly.
 *
 * Run from backend: node --env-file=.env add-lpa-to-testimonials.mjs
 */
import "./src/ensure-database-url.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const row = await prisma.siteContent.findUnique({
    where: { sectionKey: "testimonials" },
  });

  if (!row?.data || typeof row.data !== "object" || Array.isArray(row.data)) {
    console.log("No testimonials row to update — defaults already include lpa.");
  } else {
    const data = row.data;
    const items = Array.isArray(data.items) ? data.items : [];
    let changed = 0;
    const nextItems = items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const next = { ...item };
      if (typeof next.lpa !== "string") {
        next.lpa = "";
        changed += 1;
      }
      if (typeof next.avatar !== "string") next.avatar = "";
      return next;
    });

    if (changed === 0) {
      console.log("All testimonial items already have an 'lpa' field.");
    } else {
      await prisma.siteContent.update({
        where: { sectionKey: "testimonials" },
        data: { data: { ...data, items: nextItems } },
      });
      console.log(`OK: added 'lpa' to ${changed} testimonial item(s).`);
    }
  }
} finally {
  await prisma.$disconnect();
}
