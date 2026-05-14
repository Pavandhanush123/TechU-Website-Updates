// prisma/seed.js — Seeds the database with initial data.
// Run with: npx prisma db seed
//
// This replaces the old initSchema(), initCmsSchema(), and initBlogsSchema()
// functions that used raw SQL CREATE TABLE + INSERT statements.
// Prisma Migrations handle table creation; this file handles default data.

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────────────────────
// Password hashing — same logic as src/auth.js so the admin can log in
// ────────────────────────────────────────────────────────────────────────────
function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Admin User
// ────────────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@techu.in";
  const password = process.env.ADMIN_PASSWORD || "TechU@Admin2026";
  const passwordHash = hashPassword(password);

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    await prisma.userRole.upsert({
      where: {
        uniq_user_role: {
          userId: existing.id,
          role: "admin",
        },
      },
      create: {
        id: randomUUID(),
        userId: existing.id,
        role: "admin",
      },
      update: {},
    });
    console.log(`  ✓ Admin user password synced: ${email}`);
    return;
  }

  const userId = randomUUID();
  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash,
      },
    }),
    prisma.userRole.create({
      data: {
        id: randomUUID(),
        userId,
        role: "admin",
      },
    }),
  ]);
  console.log(`  ✓ Admin user created: ${email}`);
}

// ────────────────────────────────────────────────────────────────────────────
// 2. CMS Default Sections
// ────────────────────────────────────────────────────────────────────────────
const DEFAULT_SOCIALS = {
  linkedin:
    "https://www.linkedin.com/company/techu-innovation-labs/?viewAsMember=true",
  instagram: "https://www.instagram.com/techu_in/",
  youtube: "https://www.youtube.com/@TechU_In",
  facebook: "https://www.facebook.com/techutraining",
};

const CMS_DEFAULTS = {
  announcement_bar: {
    enabled: true,
    text: "Final Call: Admissions closing soon —",
    ctaLabel: "Apply now",
    ctaHref: "/#contact",
    suffix: "· Last 5 seats left",
    socials: DEFAULT_SOCIALS,
  },
  site_header: {
    logoUrl: "",
    nav: [
      { label: "Courses", to: "/courses" },
      { label: "AI Programs", href: "/#programs" },
      { label: "Webinars", href: "/#webinars" },
      { label: "Mentors", href: "/#mentors" },
      { label: "Hire Talent", href: "/#contact" },
    ],
    ctaLabel: "Become a Mentor",
    ctaHref: "/#contact",
  },
  hero: {
    slides: [
      {
        badge: "Powered by TechU",
        titleStart: "Kickstart Your Career with ",
        titleHighlight: "Job-Ready Tech Courses",
        titleEnd: "",
        description:
          "Make 2026 your year of growth. Unlock limitless opportunities with TechU.\nLearn from expert mentors with real projects and placement support.",
        features: [
          "4.95 Avg Rating",
          "500+ Learner Reviews",
          "100% Satisfied Students",
        ],
        primaryCta: "Join Now",
        secondaryCta: "Explore Courses",
        image: "",
        alt: "Two AI engineers collaborating at a workstation",
      },
      {
        badge: "UI/UX Design",
        titleStart: "Shape Ideas Into ",
        titleHighlight: "Stunning Digital Experiences",
        titleEnd: "",
        description:
          "Learn Figma, Photoshop, Illustrator, and Adobe XD with real-time projects\nand portfolio building guided by industry mentors.",
        features: ["Hands-On Projects", "Portfolio Building", "Expert Trainers"],
        primaryCta: "Enroll Now",
        secondaryCta: "Explore Courses",
        image: "",
        alt: "Designer crafting UI/UX layouts on a large monitor",
      },
      {
        badge: "Data Science & AI",
        titleStart: "Unlock the ",
        titleHighlight: "Power of Data",
        titleEnd: " with AI & ML",
        description:
          "Learn Python, Machine Learning, SQL, and AI tools with hands-on projects\nto become a skilled Data Scientist ready for the industry.",
        features: [
          "Industry Curriculum",
          "Live Sessions",
          "Placement Support",
        ],
        primaryCta: "Enroll Now",
        secondaryCta: "Explore Courses",
        image: "",
        alt: "Data analyst reviewing dashboards across multiple monitors",
      },
    ],
    livePillLabel: "Live",
    livePillText: "Register for Free Demo",
  },
  course_search: {
    courses: [
      { title: "Full Stack Development with Claude AI", slug: "fullstack", mode: "Online Live", location: "Online" },
      { title: "Full Stack Development with Claude AI", slug: "fullstack", mode: "Offline (Hyderabad)", location: "Madhapur" },
      { title: "Full Stack Development with Claude AI", slug: "fullstack", mode: "Coding Entrepreneur", location: "Madhapur" },
      { title: "Full Stack Development with Claude AI", slug: "fullstack", mode: "Advanced Coding Entrepreneur", location: "Madhapur" },
      { title: "Data Analytics with AI / ML", slug: "data-analytics", mode: "Online Live", location: "Online" },
      { title: "Data Analytics with AI / ML", slug: "data-analytics", mode: "Offline (Hyderabad)", location: "Madhapur" },
      { title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI", slug: "uiux", mode: "Online Live", location: "Online" },
      { title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI", slug: "uiux", mode: "Offline (Hyderabad)", location: "Hitech City" },
      { title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI", slug: "uiux", mode: "Digital Entrepreneur", location: "Hitech City" },
      { title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI", slug: "uiux", mode: "Advanced Digital Entrepreneur", location: "Hitech City" },
    ],
  },
  upcoming_courses: {
    title: "Explore Our Upcoming Courses",
    subtitle: "Hand-picked courses designed by industry experts to help you land your dream tech job",
    courses: [
      { title: "Full Stack Development", image: "", rating: 4.9, students: "3,567", duration: "4 Months", level: "Beginner", mode: "Offline", upcoming: true, batchNote: "" },
      { title: "Data Analytics with AI / ML", image: "", rating: 4.8, students: "2,980", duration: "4 Months", level: "Beginner", mode: "Offline", upcoming: false, batchNote: "Next Batch Starting Soon" },
      { title: "UI/UX Design", image: "", rating: 4.9, students: "3,210", duration: "3 Months", level: "Beginner", mode: "Offline", upcoming: true, batchNote: "" },
      { title: "Full Stack Development", image: "", rating: 4.9, students: "3,567", duration: "4 Months", level: "Beginner", mode: "Online", upcoming: true, batchNote: "" },
      { title: "Data Analytics with AI / ML", image: "", rating: 4.8, students: "2,980", duration: "4 Months", level: "Beginner", mode: "Online", upcoming: false, batchNote: "" },
      { title: "UI/UX Design", image: "", rating: 4.9, students: "3,210", duration: "3 Months", level: "Beginner", mode: "Online", upcoming: false, batchNote: "" },
      { title: "Full Stack Development", image: "", rating: 4.8, students: "5,210", duration: "Self-paced", level: "Beginner", mode: "Recorded", upcoming: false, batchNote: "" },
      { title: "Data Analytics with AI / ML", image: "", rating: 4.7, students: "2,140", duration: "Self-paced", level: "Beginner", mode: "Recorded", upcoming: false, batchNote: "" },
      { title: "UI/UX Design", image: "", rating: 4.8, students: "1,890", duration: "Self-paced", level: "Beginner", mode: "Recorded", upcoming: false, batchNote: "" },
    ],
  },
  mentors: {
    title: "Learn from Industry Experts",
    subtitle: "Our mentors are working professionals from top tech companies with 10+ years of experience",
    items: [
      { name: "Vishal", role: "Full Stack Trainer", expertise: "End-to-end web development · Live mentorship · Industry-aligned projects", years: "Expert Mentor", image: "" },
      { name: "Tirupathi Rao", role: "Full Stack Trainer", expertise: "Modern stacks · Backend & frontend fundamentals · Hands-on labs", years: "Expert Mentor", image: "" },
      { name: "Sai Krishna Jeedipalli", role: "UI/UX Trainer", expertise: "Figma, UX research, product design", years: "Expert Mentor", image: "" },
      { name: "PAVAN Kumar", role: "Data Analytics & AI/ML Trainer", expertise: "ML, DL, computer vision", years: "2 years · ML Engineer", image: "" },
    ],
  },
  webinars: {
    title: "Upcoming Webinars & Events",
    subtitle: "Join live sessions with industry experts and get your questions answered",
    items: [
      { title: "Getting Started with AI/ML in 2026", date: "May 10, 2026", time: "6:00 PM IST", attendees: "1,234", hostName: "Rajesh Sharma", hostRole: "AI/ML Lead at Google", badge: "Free" },
      { title: "Build a Full-Stack App with Claude AI", date: "May 17, 2026", time: "7:00 PM IST", attendees: "986", hostName: "Priya Verma", hostRole: "Principal Engineer at Microsoft", badge: "Free" },
      { title: "UI/UX Design Trends for 2026", date: "May 24, 2026", time: "6:30 PM IST", attendees: "1,420", hostName: "Ananya Reddy", hostRole: "Senior UX Designer at Meta", badge: "Free" },
    ],
  },
  infrastructure: {
    titleLine1: "Where Real Learning Meets",
    titleHighlight: "Real Learning",
    titleLine2: "Real Infrastructure",
    subtitle: "Hand-picked courses designed by industry experts to help you land your dream tech job",
    body: "Step into TechU \u2014 Hyderabad\u2019s premium AI and full-stack training institute \u2014 built with industry-grade classrooms, collaborative learning spaces, and real-time mentorship environments designed to simulate the modern workplace.",
    image: "",
    stats: [
      { label: "Graduate Placed", value: "500", suffix: "+" },
      { label: "Average Salary", value: "85k", suffix: "+" },
      { label: "Student Rating", value: "4.8", suffix: "/5" },
      { label: "Placement Rate", value: "98", suffix: "%" },
    ],
  },
  cta_banner: {
    title: "Learn Tech Skills from best Industry Experts in Hyderabad",
    primaryLabel: "Apply Today",
    secondaryLabel: "Download Curriculum",
    image: "",
    brochureUrl: "/brochures/fullstack-brochure.pdf",
  },
  testimonials: {
    title: "Success Stories",
    subtitle: "Hear from our graduates who transformed their careers",
    items: [
      { name: "Mahendra", role: "TechU Student", company: "TechU", rating: "\u2605 5.0", quote: "TechU offers the perfect mix of online and offline learning. The courses are well-structured, and the trainers are highly knowledgeable.", avatar: "" },
      { name: "Akhil", role: "TechU Student", company: "TechU", rating: "\u2605 5.0", quote: "Learning at TechU was a game-changer for me. The hands-on projects and supportive trainers made all the difference!", avatar: "" },
      { name: "Anusha", role: "TechU Student", company: "TechU", rating: "\u2605 5.0", quote: "TechU's courses are truly amazing! The expert trainers and practical approach helped me excel in my field. Highly recommend!", avatar: "" },
      { name: "Priya", role: "Full Stack Learner", company: "TechU", rating: "\u2605 5.0", quote: "The Full Stack program gave me real project exposure. I built end-to-end apps with React and Node confidently.", avatar: "" },
      { name: "Karthik", role: "Data Science Learner", company: "TechU", rating: "\u2605 5.0", quote: "Python, ML and SQL all explained from scratch with real datasets. The mentor support was outstanding.", avatar: "" },
      { name: "Sandhya", role: "UI/UX Learner", company: "TechU", rating: "\u2605 5.0", quote: "Figma, Adobe XD and live design critiques helped me build a portfolio I\u2019m genuinely proud of.", avatar: "" },
    ],
  },
  contact: {
    heading: "Contact Information",
    formBadge: "Admission Closing Soon",
    formTitle: "Start Your Application",
    formSubmitLabel: "Apply Now",
    consent: "By providing your contact details, you agree to be contacted by TechU regarding admissions and events.",
    email: "info@techu.in",
    phone: "+91 90001 44281",
    address: "101, Images Capital Park, Madhapur, Hyderabad, Telangana 500081",
    socials: DEFAULT_SOCIALS,
    stats: [
      { value: "5,910+", label: "Learners trained & growing every day" },
      { value: "100+", label: "Hiring partners across India & beyond" },
    ],
    courseOptions: [
      "Full Stack Development with Claude AI",
      "Data Analytics with AI / ML",
      "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
    ],
  },
  final_cta: {
    eyebrow: "Admissions Open \u00B7 2026 Batch",
    titleStart: "Ready to Start Your ",
    titleHighlight: "Tech Journey?",
    titleEnd: "",
    description: "Join thousands of learners who have transformed their careers with TechU. Limited seats available for the upcoming 2026 batch.",
    primaryLabel: "Enroll Now \u2014 Limited Seats",
    primaryHref: "#contact",
    secondaryLabel: "Talk to a Mentor",
    secondaryHref: "#contact",
    badges: ["EMI options available", "Money-back guarantee", "Next batch starting soon"],
  },
  site_footer: {
    logoUrl: "",
    description: "Step confidently toward your personal and professional goals with TechU \u2014 your reliable guide to mastering in-demand tech skills with offline & online training.",
    bullets: ["500+ Learner Reviews", "4.95 Average Rating", "100% Satisfied Students"],
    coursesLinks: [
      { label: "Full Stack Development", to: "/course-detail", search: { course: "fullstack" } },
      { label: "Data Analytics with AI / ML", to: "/course-detail", search: { course: "data-analytics" } },
      { label: "UI/UX Design", to: "/course-detail", search: { course: "uiux" } },
    ],
    companyLinks: [
      { label: "About Us", href: "/#contact" },
      { label: "Our Trainers", href: "/#mentors" },
      { label: "Success Stories", href: "/#stories" },
      { label: "Blog", href: "/blog" },
      { label: "Webinars", href: "/#webinars" },
      { label: "Contact", href: "/#contact" },
    ],
    email: "info@techu.in",
    phone: "+91 90001 44281",
    address: "101, Images Capital Park,\nMadhapur, Hyderabad, 500081",
    socials: DEFAULT_SOCIALS,
    copyright: "\u00A9 2026 TechU Innovation Labs. All rights reserved.",
  },
  welcome_popup: {
    enabled: true,
    title: "Get a Free 1:1 Counselling Session",
    subtitle: "Talk to our admissions team and find the right course in under 10 minutes.",
    badge: "Limited time offer",
    primaryLabel: "Book my free call",
    image: "",
    courseOptions: [
      "Full Stack Development with Claude AI",
      "Data Analytics with AI / ML",
      "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
    ],
    delaySeconds: 4,
    showAgainAfterDays: 7,
    version: 1,
  },
  seo_home: {
    title: "TechU \u2014 Job-Ready AI, Full-Stack & UI/UX Courses in Hyderabad",
    description: "Learn AI, Full-Stack Development, Data Analytics & UI/UX with TechU Innovation Labs \u2014 live mentor-led courses, real projects and 95% placement support in Hyderabad and online.",
    canonical: "",
    ogImage: "",
  },
  seo_courses: {
    title: "All Courses \u2014 TechU Innovation Labs",
    description: "Browse all TechU courses: Full Stack, Data Analytics, UI/UX, and more.",
    canonical: "",
    ogImage: "",
  },
  seo_course_detail: {
    title: "Course Details \u2014 TechU",
    description: "Detailed curriculum, mentors, projects, and outcomes.",
    canonical: "",
    ogImage: "",
  },
};

async function seedCms() {
  for (const [key, data] of Object.entries(CMS_DEFAULTS)) {
    const existing = await prisma.siteContent.findUnique({
      where: { sectionKey: key },
    });
    if (!existing) {
      await prisma.siteContent.create({
        data: { sectionKey: key, data },
      });
      console.log(`  ✓ CMS section seeded: ${key}`);
    }
  }
  console.log("  ✓ CMS seeding complete.");
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Blog Seed Posts
// ────────────────────────────────────────────────────────────────────────────
const SEED_POSTS = [
  {
    slug: "ai-for-beginners-2026-roadmap",
    title: "AI for Beginners: A No-Nonsense 2026 Roadmap",
    excerpt: "What to learn first, what to skip, and how to build something real in your first 90 days \u2014 without drowning in math.",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80",
    author: "Rajesh Sharma",
    tags: ["AI", "Machine Learning", "Career"],
    body: "If you're trying to learn AI in 2026, the biggest problem isn't a lack of resources \u2014 it's the firehose. There are too many courses, frameworks, and YouTube rabbit holes. This is the path we recommend to TechU students who join with zero ML background.\n\n## Start with the right mental model\n\nForget the math for a week. The first thing you need is **intuition** for what these systems can and can't do.\n\n- A model is a function. You give it inputs, it returns outputs.\n- Training is just adjusting parameters until the outputs look right on data you've seen.\n- Generalization is the only thing that matters: does it still work on data it hasn't seen?\n\nOnce you have that picture, every paper and tutorial becomes easier to read.\n\n## Your first 30 days\n\n1. **Python** to a comfortable level.\n2. **NumPy + pandas** \u2014 load a CSV, group it, plot it.\n3. **scikit-learn** \u2014 train a linear regression and a random forest.\n\n## Days 30\u201360: Real ML\n\nNow do the same thing with **PyTorch**. Train a small neural network on a real dataset.\n\n## Days 60\u201390: Build something\n\nBuild **one** thing end-to-end: a model, a small API, a tiny UI, deployed somewhere.\n\nIf you stick to this for 90 days, you'll be ahead of 90% of self-taught learners.",
  },
  {
    slug: "full-stack-with-claude-ai-developer-workflow",
    title: "Full-Stack with Claude AI: A Developer's Day-to-Day",
    excerpt: "How real engineers use Claude (and other AI assistants) to ship faster \u2014 and where they still need to think for themselves.",
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80",
    author: "Priya Verma",
    tags: ["Full Stack", "AI Tools", "Productivity"],
    body: "AI assistants haven't replaced full-stack developers \u2014 but they have changed what a productive day looks like.\n\n## What AI is great at\n\n- **Boilerplate.** Express routes, REST clients, form components.\n- **Refactors with a clear target.**\n- **Translation.** English to code, or vice versa.\n- **Explaining unfamiliar code.**\n\n## What it's still bad at\n\n- Holding the whole system in its head.\n- Knowing your team's conventions.\n- Picking trade-offs.\n\nUse AI as an accelerator on top of skills you already have, not a replacement for skills you haven't built yet.",
  },
  {
    slug: "ui-ux-design-trends-2026",
    title: "UI/UX Design Trends That Actually Matter in 2026",
    excerpt: "We cut through the design-blog noise and look at what's genuinely changing how products feel.",
    coverImage: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=80",
    author: "Ananya Reddy",
    tags: ["UI/UX", "Design", "Trends"],
    body: "Every January, design Twitter declares a new \"trend of the year.\" Most of them don't survive the summer.\n\n## 1. Density is back\n\nPower users are tired of scrolling through three hero sections.\n\n## 2. AI inputs as a primary surface\n\nThe \"ask in natural language\" pattern has earned a permanent spot.\n\n## 3. Motion as feedback, not decoration\n\nSubtle, fast, purposeful animation is winning.\n\n## 4. Variable fonts and real typography\n\nType design got cheap. There's no excuse for platform defaults.\n\n## 5. Accessibility from day one\n\nThis isn't a trend, it's table stakes.",
  },
  {
    slug: "data-analytics-career-switch-2026",
    title: "Switching to Data Analytics: A Realistic 6-Month Plan",
    excerpt: "From your first SQL query to your first job offer \u2014 what to learn, in what order, and how to know you're ready.",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    author: "Karthik Iyer",
    tags: ["Data Analytics", "Career", "SQL"],
    body: "Data analytics is one of the most accessible entry points into tech for career switchers.\n\n## Months 1\u20132: SQL is the entire job\n\nJoins, window functions, CTEs, performance basics.\n\n## Month 3: Visualization\n\nPick one tool: Tableau, Power BI, or Looker Studio.\n\n## Month 4: Python for analysts\n\nLoad, clean, slice, group, aggregate, and plot.\n\n## Month 5: Statistics \u2014 just enough\n\nMean vs median, confidence intervals, A/B tests, correlation vs causation.\n\n## Month 6: Portfolio + interview prep\n\nApply at month 5 even if you bomb the first few. The interviews teach you what to learn next.",
  },
  {
    slug: "first-year-tech-job-survival-guide",
    title: "Your First Year in Tech: What School Doesn't Teach You",
    excerpt: "Nine things every TechU graduate wishes they'd known before their first job offer.",
    coverImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80",
    author: "TechU Editorial",
    tags: ["Career", "Workplace", "Beginner"],
    body: "Getting hired is a milestone. Surviving the first year well is a different challenge entirely.\n\n## 1. Read the codebase before you write in it\n\nSpend your first week reading code.\n\n## 2. Your first PRs should be tiny\n\nBuild credibility with small, reliable wins.\n\n## 3. Learn to read code reviews without taking them personally\n\nReviewers are evaluating the diff, not you.\n\n## 4. Ask better questions\n\nInclude what you tried, what you expected, and what happened.\n\n## 5. Document as you go\n\nFuture-you will thank you.\n\nShow up. Pay attention. Be kind. The rest works itself out.",
  },
];

async function seedBlogs() {
  const count = await prisma.blogPost.count();
  if (count > 0) {
    console.log("  ✓ Blog posts already exist, skipping.");
    return;
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  for (let i = 0; i < SEED_POSTS.length; i++) {
    const post = SEED_POSTS[i];
    const publishedAt = new Date(now - (i + 1) * 4 * day);
    await prisma.blogPost.create({
      data: {
        id: randomUUID(),
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        coverImage: post.coverImage,
        author: post.author,
        tags: post.tags,
        published: true,
        publishedAt,
      },
    });
  }
  console.log(`  ✓ ${SEED_POSTS.length} blog posts seeded.`);
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Seeding database...\n");

  await seedAdmin();
  await seedCms();
  await seedBlogs();

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
