import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const content = await prisma.siteContent.findUnique({
    where: { sectionKey: "site_header" }
  });
  console.log("Site Header Content:", JSON.stringify(content, null, 2));
}
main().finally(() => prisma.$disconnect());
