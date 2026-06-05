import { prisma } from "./src/prisma.js";

async function main() {
  const isaLeads = await prisma.demoRequest.findMany({
    where: {
      course: {
        startsWith: "ISA Program Enquiry — ",
      },
    },
  });

  console.log(`Found ${isaLeads.length} existing ISA leads to migrate.`);

  let migrated = 0;
  for (const lead of isaLeads) {
    const rawCourse = lead.course.replace("ISA Program Enquiry — ", "");
    // Extract mode from `course (Mode)`
    const match = rawCourse.match(/\(([^)]+)\)$/);
    const mode = match ? match[1] : "Unknown";
    const course = match ? rawCourse.replace(/\s*\([^)]+\)$/, "") : rawCourse;

    await prisma.isaLead.create({
      data: {
        id: lead.id, // preserve ID
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        course: course,
        preferredMode: mode,
        status: lead.status === "new" ? "new" 
              : lead.status === "contacted" ? "contacted" 
              : lead.status === "converted" ? "converted" 
              : "archived",
        notes: lead.notes,
      },
    });

    await prisma.demoRequest.delete({
      where: { id: lead.id },
    });
    migrated++;
  }
  console.log(`Migrated ${migrated} leads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
