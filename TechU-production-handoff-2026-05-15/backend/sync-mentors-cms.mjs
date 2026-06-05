/**
 * Upserts the `mentors` CMS row so public `/api/cms/sections/mentors` matches trainer roster.
 * Run from backend: node --env-file=.env sync-mentors-cms.mjs
 */
import "./src/ensure-database-url.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mentorsPayload = {
  title: "Learn from Industry Experts",
  subtitle:
    "Our mentors are working professionals from top tech companies with 10+ years of experience",
  items: [
    {
      name: "Vishal",
      role: "MERN STACK developer + trainer",
      expertise:
        "End-to-end web development · Live mentorship · Industry-aligned projects",
      years: "Expert Mentor",
      image: "",
      track: "MERN Stack",
    },
    {
      name: "Tirupathi Rao",
      role: "Full Stack Trainer",
      expertise:
        "Modern stacks · Backend & frontend fundamentals · Hands-on labs",
      years: "Expert Mentor",
      image: "",
      track: "Full Stack",
    },
    {
      name: "Sai Krishna Jeedipalli",
      role: "UI/UX Trainer",
      expertise: "Figma, UX research, product design",
      years: "Expert Mentor",
      image: "",
      track: "UI/UX",
    },
    {
      name: "Pavan Kumar",
      role: "Data Analytics & AI/ML Trainer",
      expertise:
        "Machine learning, deep learning, computer vision, and analytics pipelines",
      years: "2 years · ML Engineer",
      image: "",
      track: "Data & AI/ML",
    },
  ],
};

try {
  await prisma.siteContent.upsert({
    where: { sectionKey: "mentors" },
    create: {
      sectionKey: "mentors",
      data: mentorsPayload,
    },
    update: {
      data: mentorsPayload,
    },
  });
  console.log("OK: mentors section synced.");
} finally {
  await prisma.$disconnect();
}
