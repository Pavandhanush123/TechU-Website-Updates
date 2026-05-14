// CMS-style key/JSON content store. Each row = one editable site section.
// Admins write via /api/admin/cms/sections/:key; the public frontend reads
// via /api/cms/sections/:key.

import { prisma } from "./prisma.js";

export const CMS_SECTION_KEYS = [
  "announcement_bar",
  "site_header",
  "hero",
  "course_search",
  "upcoming_courses",
  "mentors",
  "webinars",
  "infrastructure",
  "cta_banner",
  "testimonials",
  "contact",
  "final_cta",
  "site_footer",
  "welcome_popup",
  "seo_home",
  "seo_courses",
  "seo_course_detail",
];

const DEFAULT_SOCIALS = {
  linkedin:
    "https://www.linkedin.com/company/techu-innovation-labs/?viewAsMember=true",
  facebook: "https://www.facebook.com/techutraining",
  instagram: "https://www.instagram.com/techu_in/",
  youtube: "https://www.youtube.com/@TechU_In",
};

const DEFAULTS = {
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
      {
        title: "Full Stack Development with Claude AI",
        slug: "fullstack",
        mode: "Online Live",
        location: "Online",
      },
      {
        title: "Full Stack Development with Claude AI",
        slug: "fullstack",
        mode: "Offline (Hyderabad)",
        location: "Madhapur",
      },
      {
        title: "Full Stack Development with Claude AI",
        slug: "fullstack",
        mode: "Coding Entrepreneur",
        location: "Madhapur",
      },
      {
        title: "Full Stack Development with Claude AI",
        slug: "fullstack",
        mode: "Advanced Coding Entrepreneur",
        location: "Madhapur",
      },
      {
        title: "Data Analytics with AI / ML",
        slug: "data-analytics",
        mode: "Online Live",
        location: "Online",
      },
      {
        title: "Data Analytics with AI / ML",
        slug: "data-analytics",
        mode: "Offline (Hyderabad)",
        location: "Madhapur",
      },
      {
        title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
        slug: "uiux",
        mode: "Online Live",
        location: "Online",
      },
      {
        title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
        slug: "uiux",
        mode: "Offline (Hyderabad)",
        location: "Hitech City",
      },
      {
        title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
        slug: "uiux",
        mode: "Digital Entrepreneur",
        location: "Hitech City",
      },
      {
        title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
        slug: "uiux",
        mode: "Advanced Digital Entrepreneur",
        location: "Hitech City",
      },
    ],
  },

  upcoming_courses: {
    title: "Explore Our Upcoming Courses",
    subtitle:
      "Hand-picked courses designed by industry experts to help you land your dream tech job",
    courses: [
      {
        title: "Full Stack Development",
        image: "",
        rating: 4.9,
        students: "3,567",
        duration: "4 Months",
        level: "Beginner",
        mode: "Offline",
        upcoming: true,
        batchNote: "",
      },
      {
        title: "Data Analytics with AI / ML",
        image: "",
        rating: 4.8,
        students: "2,980",
        duration: "4 Months",
        level: "Beginner",
        mode: "Offline",
        upcoming: false,
        batchNote: "Next Batch Starting Soon",
      },
      {
        title: "UI/UX Design",
        image: "",
        rating: 4.9,
        students: "3,210",
        duration: "3 Months",
        level: "Beginner",
        mode: "Offline",
        upcoming: true,
        batchNote: "",
      },
      {
        title: "Full Stack Development",
        image: "",
        rating: 4.9,
        students: "3,567",
        duration: "4 Months",
        level: "Beginner",
        mode: "Online",
        upcoming: true,
        batchNote: "",
      },
      {
        title: "Data Analytics with AI / ML",
        image: "",
        rating: 4.8,
        students: "2,980",
        duration: "4 Months",
        level: "Beginner",
        mode: "Online",
        upcoming: false,
        batchNote: "",
      },
      {
        title: "UI/UX Design",
        image: "",
        rating: 4.9,
        students: "3,210",
        duration: "3 Months",
        level: "Beginner",
        mode: "Online",
        upcoming: false,
        batchNote: "",
      },
      {
        title: "Full Stack Development",
        image: "",
        rating: 4.8,
        students: "5,210",
        duration: "Self-paced",
        level: "Beginner",
        mode: "Recorded",
        upcoming: false,
        batchNote: "",
      },
      {
        title: "Data Analytics with AI / ML",
        image: "",
        rating: 4.7,
        students: "2,140",
        duration: "Self-paced",
        level: "Beginner",
        mode: "Recorded",
        upcoming: false,
        batchNote: "",
      },
      {
        title: "UI/UX Design",
        image: "",
        rating: 4.8,
        students: "1,890",
        duration: "Self-paced",
        level: "Beginner",
        mode: "Recorded",
        upcoming: false,
        batchNote: "",
      },
    ],
  },

  mentors: {
    title: "Learn from Industry Experts",
    subtitle:
      "Our mentors are working professionals from top tech companies with 10+ years of experience",
    items: [
      {
        name: "Vishal",
        role: "Full Stack Trainer",
        expertise:
          "End-to-end web development · Live mentorship · Industry-aligned projects",
        years: "Expert Mentor",
        image: "",
      },
      {
        name: "Tirupathi Rao",
        role: "Full Stack Trainer",
        expertise:
          "Modern stacks · Backend & frontend fundamentals · Hands-on labs",
        years: "Expert Mentor",
        image: "",
      },
      {
        name: "Sai Krishna Jeedipalli",
        role: "UI/UX Trainer",
        expertise: "Figma, UX research, product design",
        years: "Expert Mentor",
        image: "",
      },
      {
        name: "PAVAN Kumar",
        role: "Data Analytics & AI/ML Trainer",
        expertise: "ML, DL, computer vision",
        years: "2 years · ML Engineer",
        image: "",
      },
    ],
  },

  webinars: {
    title: "Upcoming Webinars & Events",
    subtitle:
      "Join live sessions with industry experts and get your questions answered",
    items: [
      {
        title: "Getting Started with AI/ML in 2026",
        date: "May 10, 2026",
        time: "6:00 PM IST",
        attendees: "1,234",
        hostName: "Rajesh Sharma",
        hostRole: "AI/ML Lead at Google",
        badge: "Free",
      },
      {
        title: "Build a Full-Stack App with Claude AI",
        date: "May 17, 2026",
        time: "7:00 PM IST",
        attendees: "986",
        hostName: "Priya Verma",
        hostRole: "Principal Engineer at Microsoft",
        badge: "Free",
      },
      {
        title: "UI/UX Design Trends for 2026",
        date: "May 24, 2026",
        time: "6:30 PM IST",
        attendees: "1,420",
        hostName: "Ananya Reddy",
        hostRole: "Senior UX Designer at Meta",
        badge: "Free",
      },
    ],
  },

  infrastructure: {
    titleLine1: "Where Real Learning Meets",
    titleHighlight: "Real Learning",
    titleLine2: "Real Infrastructure",
    subtitle:
      "Hand-picked courses designed by industry experts to help you land your dream tech job",
    body: "Step into TechU — Hyderabad's premium AI and full-stack training institute — built with industry-grade classrooms, collaborative learning spaces, and real-time mentorship environments designed to simulate the modern workplace.",
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
      {
        name: "Mahendra",
        role: "TechU Student",
        company: "TechU",
        rating: "★ 5.0",
        quote:
          "TechU offers the perfect mix of online and offline learning. The courses are well-structured, and the trainers are highly knowledgeable.",
        avatar: "",
      },
      {
        name: "Akhil",
        role: "TechU Student",
        company: "TechU",
        rating: "★ 5.0",
        quote:
          "Learning at TechU was a game-changer for me. The hands-on projects and supportive trainers made all the difference!",
        avatar: "",
      },
      {
        name: "Anusha",
        role: "TechU Student",
        company: "TechU",
        rating: "★ 5.0",
        quote:
          "TechU's courses are truly amazing! The expert trainers and practical approach helped me excel in my field. Highly recommend!",
        avatar: "",
      },
      {
        name: "Priya",
        role: "Full Stack Learner",
        company: "TechU",
        rating: "★ 5.0",
        quote:
          "The Full Stack program gave me real project exposure. I built end-to-end apps with React and Node confidently.",
        avatar: "",
      },
      {
        name: "Karthik",
        role: "Data Science Learner",
        company: "TechU",
        rating: "★ 5.0",
        quote:
          "Python, ML and SQL all explained from scratch with real datasets. The mentor support was outstanding.",
        avatar: "",
      },
      {
        name: "Sandhya",
        role: "UI/UX Learner",
        company: "TechU",
        rating: "★ 5.0",
        quote:
          "Figma, Adobe XD and live design critiques helped me build a portfolio I'm genuinely proud of.",
        avatar: "",
      },
    ],
  },

  contact: {
    heading: "Contact Information",
    formBadge: "Admission Closing Soon",
    formTitle: "Start Your Application",
    formSubmitLabel: "Apply Now",
    consent:
      "By providing your contact details, you agree to be contacted by TechU regarding admissions and events.",
    email: "info@techu.in",
    phone: "+91 90001 44281",
    address:
      "101, Images Capital Park, Madhapur, Hyderabad, Telangana 500081",
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
    eyebrow: "Admissions Open · 2026 Batch",
    titleStart: "Ready to Start Your ",
    titleHighlight: "Tech Journey?",
    titleEnd: "",
    description:
      "Join thousands of learners who have transformed their careers with TechU. Limited seats available for the upcoming 2026 batch.",
    primaryLabel: "Enroll Now — Limited Seats",
    primaryHref: "#contact",
    secondaryLabel: "Talk to a Mentor",
    secondaryHref: "#contact",
    badges: [
      "EMI options available",
      "Money-back guarantee",
      "Next batch starting soon",
    ],
  },

  site_footer: {
    logoUrl: "",
    description:
      "Step confidently toward your personal and professional goals with TechU — your reliable guide to mastering in-demand tech skills with offline & online training.",
    bullets: [
      "500+ Learner Reviews",
      "4.95 Average Rating",
      "100% Satisfied Students",
    ],
    coursesLinks: [
      {
        label: "Full Stack Development",
        to: "/course-detail",
        search: { course: "fullstack" },
      },
      {
        label: "Data Analytics with AI / ML",
        to: "/course-detail",
        search: { course: "data-analytics" },
      },
      {
        label: "UI/UX Design",
        to: "/course-detail",
        search: { course: "uiux" },
      },
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
    copyright: "© 2026 TechU Innovation Labs. All rights reserved.",
  },

  welcome_popup: {
    enabled: true,
    title: "Get a Free 1:1 Counselling Session",
    subtitle:
      "Talk to our admissions team and find the right course in under 10 minutes.",
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
    title: "TechU — Job-Ready AI, Full-Stack & UI/UX Courses in Hyderabad",
    description:
      "Learn AI, Full-Stack Development, Data Analytics & UI/UX with TechU Innovation Labs — live mentor-led courses, real projects and 95% placement support in Hyderabad and online.",
    canonical: "",
    ogImage: "",
  },

  seo_courses: {
    title: "All Courses — TechU Innovation Labs",
    description:
      "Browse all TechU courses: Full Stack, Data Analytics, UI/UX, and more.",
    canonical: "",
    ogImage: "",
  },

  seo_course_detail: {
    title: "Course Details — TechU",
    description: "Detailed curriculum, mentors, projects, and outcomes.",
    canonical: "",
    ogImage: "",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// OLD: initCmsSchema() removed — table creation is now handled by Prisma
// Migrations (npx prisma migrate dev). Default CMS data is seeded via
// npx prisma db seed (see prisma/seed.js).
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function getSection(key) {
//   const [rows] = await pool.query(
//     "SELECT section_key, data, updated_at FROM site_content WHERE section_key = ? LIMIT 1",
//     [key],
//   );
//   if (rows.length === 0) return null;
//   const row = rows[0];
//   return {
//     key: row.section_key,
//     data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
//     updatedAt: row.updated_at,
//   };
// }

// NEW: Prisma implementation
export async function getSection(key) {
  const row = await prisma.siteContent.findUnique({
    where: { sectionKey: key },
  });
  if (!row) return null;
  return {
    key: row.sectionKey,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    updatedAt: row.updatedAt,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function listSections() {
//   const [rows] = await pool.query(
//     "SELECT section_key, data, updated_at FROM site_content ORDER BY section_key ASC",
//   );
//   return rows.map((r) => ({
//     key: r.section_key,
//     data: typeof r.data === "string" ? JSON.parse(r.data) : r.data,
//     updatedAt: r.updated_at,
//   }));
// }

// NEW: Prisma implementation
export async function listSections() {
  const rows = await prisma.siteContent.findMany({
    orderBy: { sectionKey: "asc" },
  });
  return rows.map((r) => ({
    key: r.sectionKey,
    data: typeof r.data === "string" ? JSON.parse(r.data) : r.data,
    updatedAt: r.updatedAt,
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function upsertSection(key, data) {
//   await pool.query(
//     `INSERT INTO site_content (section_key, data)
//        VALUES (?, CAST(? AS JSON))
//      ON DUPLICATE KEY UPDATE data = VALUES(data)`,
//     [key, JSON.stringify(data)],
//   );
// }

// NEW: Prisma implementation
export async function upsertSection(key, data) {
  await prisma.siteContent.upsert({
    where: { sectionKey: key },
    update: { data },
    create: { sectionKey: key, data },
  });
}

