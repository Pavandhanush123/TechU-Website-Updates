import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const data = {
    logoUrl: "",
    nav: [
      { label: "Courses", to: "/courses" },
      { label: "AI Programs", href: "/#programs" },
      { label: "Webinars", href: "/#webinars" },
      { label: "Mentors", href: "/#mentors" },
      { label: "Blog", to: "/blog" },
      { label: "Hire Talent", href: "/#contact" },
    ],
    ctaLabel: "Become a Mentor",
    ctaHref: "/#contact",
  };

  await prisma.siteContent.upsert({
    where: { sectionKey: "site_header" },
    update: { data },
    create: { sectionKey: "site_header", data },
  });

  console.log("Site header updated successfully.");
}

main().finally(() => prisma.$disconnect());
