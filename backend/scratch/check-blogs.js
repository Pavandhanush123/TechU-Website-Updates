import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.blogPost.count();
  console.log("Blog post count:", count);
  const posts = await prisma.blogPost.findMany({ select: { slug: true, published: true } });
  console.log("Posts:", JSON.stringify(posts, null, 2));
}
main().finally(() => prisma.$disconnect());
