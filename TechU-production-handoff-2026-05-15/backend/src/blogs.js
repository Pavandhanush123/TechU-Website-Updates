// Blog post storage. Posts have a unique slug for public URLs and a draft/
// published flag. The body is stored as markdown text — the public frontend
// renders it. Tags are a JSON array of strings.

import { randomUUID } from "node:crypto";
import { newId } from "./db.js";
import { prisma } from "./prisma.js";

// ────────────────────────────────────────────────────────────────────────────
// OLD: initBlogsSchema() removed — table creation is now handled by Prisma
// Migrations (npx prisma migrate dev). Blog seed data is seeded via
// npx prisma db seed (see prisma/seed.js).
// ────────────────────────────────────────────────────────────────────────────

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: rowToPost helper for raw SQL rows (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// function rowToPost(row) {
//   return {
//     id: row.id,
//     slug: row.slug,
//     title: row.title,
//     excerpt: row.excerpt,
//     body: row.body,
//     coverImage: row.cover_image,
//     author: row.author,
//     tags:
//       typeof row.tags === "string"
//         ? safeParseTags(row.tags)
//         : Array.isArray(row.tags)
//           ? row.tags
//           : [],
//     published: !!row.published,
//     publishedAt: row.published_at,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at,
//   };
// }

// NEW: Prisma returns camelCase fields directly; this thin adapter
// ensures tags are always a safe array (matches old behavior).
function rowToPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.coverImage,
    author: row.author,
    tags: Array.isArray(row.tags) ? row.tags : [],
    published: !!row.published,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function safeParseTags(s) {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function listPostsAdmin() {
//   const [rows] = await pool.query(
//     `SELECT id, slug, title, excerpt, body, cover_image, author, tags,
//             published, published_at, created_at, updated_at
//        FROM blog_posts
//       ORDER BY COALESCE(published_at, created_at) DESC`,
//   );
//   return rows.map(rowToPost);
// }

// NEW: Prisma implementation
// Note: Prisma doesn't support COALESCE in orderBy, so we fetch all and
// sort in JS. For the typical blog post count (<1000) this is fine.
export async function listPostsAdmin() {
  const rows = await prisma.blogPost.findMany();
  const posts = rows.map(rowToPost);
  posts.sort((a, b) => {
    const dateA = a.publishedAt ?? a.createdAt;
    const dateB = b.publishedAt ?? b.createdAt;
    return new Date(dateB) - new Date(dateA);
  });
  return posts;
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function listPostsPublic() {
//   const [rows] = await pool.query(
//     `SELECT id, slug, title, excerpt, body, cover_image, author, tags,
//             published, published_at, created_at, updated_at
//        FROM blog_posts
//       WHERE published = 1
//       ORDER BY COALESCE(published_at, created_at) DESC`,
//   );
//   return rows.map(rowToPost);
// }

// NEW: Prisma implementation
export async function listPostsPublic() {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
  });
  const posts = rows.map(rowToPost);
  posts.sort((a, b) => {
    const dateA = a.publishedAt ?? a.createdAt;
    const dateB = b.publishedAt ?? b.createdAt;
    return new Date(dateB) - new Date(dateA);
  });
  return posts;
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function getPostById(id) {
//   const [rows] = await pool.query(
//     `SELECT * FROM blog_posts WHERE id = ? LIMIT 1`,
//     [id],
//   );
//   return rows[0] ? rowToPost(rows[0]) : null;
// }

// NEW: Prisma implementation
export async function getPostById(id) {
  const row = await prisma.blogPost.findUnique({ where: { id } });
  return row ? rowToPost(row) : null;
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function getPostBySlug(slug, { onlyPublished = false } = {}) {
//   const sql = onlyPublished
//     ? `SELECT * FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1`
//     : `SELECT * FROM blog_posts WHERE slug = ? LIMIT 1`;
//   const [rows] = await pool.query(sql, [slug]);
//   return rows[0] ? rowToPost(rows[0]) : null;
// }

// NEW: Prisma implementation
export async function getPostBySlug(slug, { onlyPublished = false } = {}) {
  const where = onlyPublished ? { slug, published: true } : { slug };
  const row = await prisma.blogPost.findFirst({ where });
  return row ? rowToPost(row) : null;
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// async function nextAvailableSlug(base) {
//   let candidate = base || "post";
//   let suffix = 0;
//   for (let i = 0; i < 200; i++) {
//     const [rows] = await pool.query(
//       "SELECT 1 FROM blog_posts WHERE slug = ? LIMIT 1",
//       [candidate],
//     );
//     if (rows.length === 0) return candidate;
//     suffix += 1;
//     candidate = `${base}-${suffix}`;
//   }
//   return `${base}-${Date.now()}`;
// }

// NEW: Prisma implementation
async function nextAvailableSlug(base) {
  let candidate = base || "post";
  let suffix = 0;
  for (let i = 0; i < 200; i++) {
    const existing = await prisma.blogPost.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function createPost(input) {
//   const id = newId();
//   const desiredSlug = slugify(input.slug || input.title);
//   const slug = await nextAvailableSlug(desiredSlug);
//   const publishedAt = input.published ? new Date() : null;
//   await pool.query(
//     `INSERT INTO blog_posts
//        (id, slug, title, excerpt, body, cover_image, author, tags,
//         published, published_at)
//      VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)`,
//     [
//       id, slug, input.title, input.excerpt ?? "", input.body ?? "",
//       input.coverImage ?? "", input.author ?? "",
//       JSON.stringify(input.tags ?? []),
//       input.published ? 1 : 0, publishedAt,
//     ],
//   );
//   return getPostById(id);
// }

// NEW: Prisma implementation
export async function createPost(input) {
  const id = newId();
  const desiredSlug = slugify(input.slug || input.title);
  const slug = await nextAvailableSlug(desiredSlug);
  const publishedAt = input.published ? new Date() : null;

  await prisma.blogPost.create({
    data: {
      id,
      slug,
      title: input.title,
      excerpt: input.excerpt ?? "",
      body: input.body ?? "",
      coverImage: input.coverImage ?? "",
      author: input.author ?? "",
      tags: input.tags ?? [],
      published: !!input.published,
      publishedAt,
    },
  });
  return getPostById(id);
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function updatePost(id, patch) {
//   const existing = await getPostById(id);
//   if (!existing) return null;
//   let nextSlug = existing.slug;
//   if (patch.slug !== undefined) {
//     const desired = slugify(patch.slug || existing.title);
//     if (desired !== existing.slug) {
//       nextSlug = await nextAvailableSlug(desired);
//     }
//   }
//   const willPublish =
//     patch.published !== undefined ? !!patch.published : existing.published;
//   let nextPublishedAt = existing.publishedAt;
//   if (willPublish && !existing.published) nextPublishedAt = new Date();
//   if (!willPublish) nextPublishedAt = null;
//   await pool.query(
//     `UPDATE blog_posts SET
//        slug = ?, title = ?, excerpt = ?, body = ?,
//        cover_image = ?, author = ?, tags = CAST(? AS JSON),
//        published = ?, published_at = ?
//      WHERE id = ?`,
//     [
//       nextSlug, patch.title ?? existing.title,
//       patch.excerpt ?? existing.excerpt, patch.body ?? existing.body,
//       patch.coverImage ?? existing.coverImage, patch.author ?? existing.author,
//       JSON.stringify(patch.tags ?? existing.tags),
//       willPublish ? 1 : 0, nextPublishedAt, id,
//     ],
//   );
//   return getPostById(id);
// }

// NEW: Prisma implementation
export async function updatePost(id, patch) {
  const existing = await getPostById(id);
  if (!existing) return null;

  let nextSlug = existing.slug;
  if (patch.slug !== undefined) {
    const desired = slugify(patch.slug || existing.title);
    if (desired !== existing.slug) {
      nextSlug = await nextAvailableSlug(desired);
    }
  }

  const willPublish =
    patch.published !== undefined ? !!patch.published : existing.published;

  // Stamp publishedAt the first time a post becomes published.
  let nextPublishedAt = existing.publishedAt;
  if (willPublish && !existing.published) nextPublishedAt = new Date();
  if (!willPublish) nextPublishedAt = null;

  await prisma.blogPost.update({
    where: { id },
    data: {
      slug: nextSlug,
      title: patch.title ?? existing.title,
      excerpt: patch.excerpt ?? existing.excerpt,
      body: patch.body ?? existing.body,
      coverImage: patch.coverImage ?? existing.coverImage,
      author: patch.author ?? existing.author,
      tags: patch.tags ?? existing.tags,
      published: willPublish,
      publishedAt: nextPublishedAt,
    },
  });

  return getPostById(id);
}

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// export async function deletePost(id) {
//   const [result] = await pool.query("DELETE FROM blog_posts WHERE id = ?", [id]);
//   return result.affectedRows > 0;
// }

// NEW: Prisma implementation
export async function deletePost(id) {
  try {
    await prisma.blogPost.delete({ where: { id } });
    return true;
  } catch {
    // Record not found — matches old behavior of returning false
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Seed posts — inserted once when the blog_posts table is first created.
// Admins can edit, unpublish, or delete them from /admin/blogs at any time.
// ────────────────────────────────────────────────────────────────────────────

const SEED_POSTS = [
  {
    slug: "ai-for-beginners-2026-roadmap",
    title:
      "AI for Beginners: A No-Nonsense 2026 Roadmap",
    excerpt:
      "What to learn first, what to skip, and how to build something real in your first 90 days — without drowning in math.",
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80",
    author: "Rajesh Sharma",
    tags: ["AI", "Machine Learning", "Career"],
    body: `If you're trying to learn AI in 2026, the biggest problem isn't a lack of resources — it's the firehose. There are too many courses, frameworks, and YouTube rabbit holes. This is the path we recommend to TechU students who join with zero ML background.

## Start with the right mental model

Forget the math for a week. The first thing you need is **intuition** for what these systems can and can't do.

- A model is a function. You give it inputs, it returns outputs.
- Training is just adjusting parameters until the outputs look right on data you've seen.
- Generalization is the only thing that matters: does it still work on data it hasn't seen?

Once you have that picture, every paper and tutorial becomes easier to read.

## Your first 30 days

1. **Python** to a comfortable level — lists, dicts, functions, classes, list comprehensions, basic file I/O.
2. **NumPy + pandas** — load a CSV, group it, plot it, run the basics. Real data, not toy data.
3. **scikit-learn** — train a linear regression and a random forest. Pick something boring like "predict house prices." It's boring on purpose.

> If you can't load a CSV, group by a column, and train a model that beats the mean, you're not ready for deep learning.

## Days 30–60: Real ML

Now do the same thing you did with sklearn, but with **PyTorch**. Train a small neural network on a real dataset (Fashion-MNIST is fine). Fight with shapes, fight with gradients, get it wrong, fix it. This is where the learning happens.

## Days 60–90: Build something

This is the part most learners skip — and it's the part that gets you hired. Build **one** thing end-to-end:

- A model
- A small API around it (FastAPI, Flask, whatever)
- A tiny UI that calls the API
- Deployed somewhere a stranger can poke at it

It doesn't matter if it's good. It matters that you shipped it.

## What to skip (for now)

- LLM fine-tuning — wait until you understand vanilla supervised learning first.
- Kubernetes — a cron job is fine for v1.
- "AI agents" — the abstraction is leaky and you'll learn more by building one without a framework.

## Common traps

- **Tutorial paralysis.** You don't need a fifth course on logistic regression. You need a project.
- **Math gatekeeping.** You can be a working ML engineer with high-school algebra and a strong intuition. The math becomes interesting *after* you've built things and want to understand why they work.
- **Chasing the latest paper.** The last 12 months of arXiv won't help you get a job. Solid fundamentals will.

If you stick to this for 90 days, you'll be ahead of 90% of self-taught learners. That's the bar — not "world-class researcher," just *measurably better than someone who only watched videos*.`,
  },
  {
    slug: "full-stack-with-claude-ai-developer-workflow",
    title: "Full-Stack with Claude AI: A Developer's Day-to-Day",
    excerpt:
      "How real engineers use Claude (and other AI assistants) to ship faster — and where they still need to think for themselves.",
    coverImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80",
    author: "Priya Verma",
    tags: ["Full Stack", "AI Tools", "Productivity"],
    body: `AI assistants haven't replaced full-stack developers — but they have changed what a productive day looks like. Here's how the engineers we train at TechU are actually using these tools in 2026.

## What AI is great at

- **Boilerplate.** Express routes, REST clients, form components, regex, SQL joins. The stuff you've written a hundred times.
- **Refactors with a clear target.** "Pull this 200-line component apart into three smaller ones."
- **Translation.** Going from a description in English to a first-draft implementation, or vice versa.
- **Explaining unfamiliar code.** Especially the kind written by someone who left the company three years ago.

## What it's still bad at

- **Holding the whole system in its head.** Anything spanning more than a couple of files is fragile.
- **Knowing your team's conventions.** It will happily import lodash in a codebase that's banned it for two years.
- **Picking trade-offs.** "Should this be a database column or a JSON blob?" is a judgment call. AI will give you a confident answer for either side, depending on how you ask.

> The best engineers we see treat AI like a fast but slightly overconfident junior. Trust it for the easy stuff. Sanity-check it for the hard stuff. Never let it touch production without reading the diff.

## A typical full-stack day

1. **Plan.** Sketch the feature in plain English in a doc. No AI yet — this is where your judgment matters most.
2. **Scaffold.** Ask Claude (or your editor's assistant) to create the empty files, types, and route handlers. Read every line before saving.
3. **Implement.** Pair with the assistant on individual functions. Reject suggestions that don't match your codebase's style.
4. **Test.** Write the test cases yourself. AI is fine at *implementing* a test once you've written its name and expectations, but worse at deciding what's worth testing.
5. **Review.** Diff your branch against main and read it. Ask the AI for a review only after you've done your own.

## The two skills that still matter

1. **Reading code carefully.** Most production bugs come from a line that *looked* right but wasn't. AI won't catch that for you — it'll often write the bug.
2. **System design.** Nothing in your tooling helps you decide whether to use Postgres or Redis, queues or webhooks, monolith or microservices. That's still on you.

If you're learning full-stack right now, don't let the existence of AI tools convince you to skip fundamentals. Use them — but treat them as an accelerator on top of skills you already have, not a replacement for skills you haven't built yet.`,
  },
  {
    slug: "ui-ux-design-trends-2026",
    title: "UI/UX Design Trends That Actually Matter in 2026",
    excerpt:
      "We cut through the design-blog noise and look at what's genuinely changing how products feel — and what's just Pinterest fashion.",
    coverImage:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=80",
    author: "Ananya Reddy",
    tags: ["UI/UX", "Design", "Trends"],
    body: `Every January, design Twitter declares a new "trend of the year." Most of them don't survive the summer. Here's what we think is actually changing in product design — based on what teams hiring our UI/UX graduates ask for.

## 1. Density is back

The 2018–2022 era of *huge type, oceans of whitespace, every screen has six elements* is fading. Power users are tired of scrolling through three hero sections to do anything. Look at Linear, Raycast, Notion's recent updates — they're all dense, fast, and respect your screen real estate.

For learners: **stop padding everything to 64px.** Use a real spacing scale and let related elements sit close together.

## 2. AI inputs as a primary surface

The "ask in natural language, get something useful back" pattern has earned a permanent spot in product UIs. But — and this is the design challenge — most teams are getting it wrong.

The good ones share three properties:
- The input is **inline**, not in a separate "AI assistant" sidebar nobody opens
- The output is **editable** — you can tweak what the AI produced, you don't have to re-prompt
- There's an obvious **manual fallback** for when the AI is confidently wrong

## 3. Motion as feedback, not decoration

Subtle, fast, purposeful animation is winning over the "let's animate everything for 600ms" school of 2020. If a transition takes longer than 200ms and doesn't communicate state, cut it.

> A useful test: turn off animations. Does your product still feel professional? If yes, your animations are doing their job. If it suddenly feels like a CMS template, your animations were doing too much heavy lifting.

## 4. Variable fonts and real typography

Type design got cheap. There's no excuse for shipping with the platform default unless it's a deliberate choice. Variable fonts let you ship one file with a full weight range — use it.

## 5. Accessibility from day one

This isn't a trend, it's table stakes now. Color contrast, keyboard navigation, focus states, screen-reader labels — if you ship a product without these, you're filtering out customers and risking legal action depending on jurisdiction.

The good news: most of it is muscle memory after a couple of projects. Build it in from your first wireframe.

## What's overrated

- **Glassmorphism revivals.** Looks great in a dribble shot, awful in a 1000-row table.
- **AI-generated illustrations as your hero image.** Everyone's using the same three styles. It looks generic instantly.
- **"Bento" grids on every page.** Great for marketing sites, weird everywhere else.

If you're learning design right now, the meta-skill that compounds is **paying attention to products you actually use** and asking *why does this feel good?* and *why does this feel cheap?* That habit beats any trends post.`,
  },
  {
    slug: "data-analytics-career-switch-2026",
    title:
      "Switching to Data Analytics: A Realistic 6-Month Plan",
    excerpt:
      "From your first SQL query to your first job offer — what to learn, in what order, and how to know you're ready.",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    author: "Karthik Iyer",
    tags: ["Data Analytics", "Career", "SQL"],
    body: `Data analytics is one of the most accessible entry points into tech for career switchers — but accessible doesn't mean easy. Here's the path we recommend, condensed from years of helping students transition into analyst roles.

## Months 1–2: SQL is the entire job

If you can't write SQL, nothing else matters. The reverse isn't true — most analyst roles can be done with strong SQL plus modest Excel skills.

What "strong SQL" means in practice:
- **Joins** — inner, left, full, self. Knowing when to use which.
- **Window functions** — \`ROW_NUMBER\`, \`LAG\`, \`SUM() OVER\`. They feel weird at first; do enough exercises that they stop feeling weird.
- **CTEs and subqueries** — and knowing when to refactor a 200-line query into named steps.
- **Performance basics** — what an index does, why \`SELECT *\` in production is a code smell.

Practice on real datasets, not the AdventureWorks sample. Kaggle has hundreds of free ones.

## Month 3: Visualization

Pick one tool and get good at it. **Tableau, Power BI, or Looker Studio** — any of them will do for getting hired. Don't waste a month evaluating; pick the one your local job market uses most.

Build three dashboards:
1. A **descriptive** dashboard (what happened) — a sales overview, traffic report, KPI tracker
2. A **diagnostic** dashboard (why did it happen) — drill-downs, segment comparisons
3. A **predictive** dashboard (what might happen next) — forecasts, cohorts, retention curves

Put screenshots in your portfolio. Hiring managers want to see you've actually done the work, not just claim it.

## Month 4: Python for analysts

You don't need to be a software engineer. You need to:
- Load a CSV / Excel / database query into a DataFrame
- Clean it (missing values, type coercion, deduplication)
- Slice, group, and aggregate
- Plot results (matplotlib or seaborn — pick one)

That's it. A working analyst's Python skills look almost nothing like a working developer's.

## Month 5: Statistics — just enough

You need to know:
- The difference between mean, median, mode, and when each lies to you
- Confidence intervals and what a p-value actually means (most people get this wrong)
- A/B test reading: what statistical significance is and why it doesn't equal "important"
- Correlation vs. causation, in your bones, forever

You do **not** need: graduate-level probability theory, the proofs behind regression, or Bayesian statistics. Those become useful later if you specialize.

## Month 6: Portfolio + interview prep

By month 6 you should have:
- 3–5 SQL case studies in a public GitHub repo
- 2–3 Tableau / Power BI dashboards screenshotted in a portfolio site
- One end-to-end project: data extraction → cleaning → analysis → recommendation

Then start interviewing. **Most analyst interviews are SQL whiteboards** — keep practicing them weekly even after you start applying.

> The biggest mistake we see: people learn for 9 months waiting to feel "ready." You're never going to feel ready. Apply at month 5 even if you bomb the first few. The interviews are where you find out what you actually need to learn next.

Six months is a real, honest timeline if you can put in 12–15 hours a week. You can do it faster full-time. You'll do it slower if you skip the project work.`,
  },
  {
    slug: "first-year-tech-job-survival-guide",
    title:
      "Your First Year in Tech: What School Doesn't Teach You",
    excerpt:
      "Nine things every TechU graduate wishes they'd known before their first job offer — from code reviews to office politics.",
    coverImage:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80",
    author: "TechU Editorial",
    tags: ["Career", "Workplace", "Beginner"],
    body: `Getting hired is a milestone. Surviving the first year well is a different challenge entirely. Here's the unwritten curriculum we wish someone had handed our students at orientation.

## 1. Read the codebase before you write in it

Spend your first week (yes, full week) reading code. Understand the file structure. Find the test runner. Learn how a typical request flows through the system. It feels unproductive. It isn't.

## 2. Your first PRs should be tiny

A 12-line bug fix that you understand cold beats a 400-line feature that needs three rounds of review. Build credibility with small, reliable wins before you tackle anything ambitious.

## 3. Learn to read code reviews without taking them personally

Reviewers aren't evaluating you; they're evaluating the diff. "This isn't quite right" doesn't mean "you aren't quite right." A senior engineer's job is to write feedback that makes the code better, not feedback that makes you feel good.

> If a review hurts to read, close the tab, make tea, come back in twenty minutes. Then re-read it. Almost every time, you'll see it was clearer than you remembered.

## 4. Ask better questions

Bad: "How do I do X?"
Better: "I'm trying to do X. I tried Y, expecting Z, but I got W. Here's the relevant code. What am I missing?"

The second version respects the responder's time and usually unblocks you faster, because half the time you'll figure it out while writing the question.

## 5. Document as you go

You learn things every day in your first year that you'll forget by your second. Keep a running notes file. Future-you will thank you.

## 6. Production is sacred

Some specific rules:
- **Never** push directly to main on day one.
- **Always** test locally before opening a PR.
- **Always** read your own diff before requesting review.
- If you broke production, the fastest way to recover trust is to be the first to say so, write a clear post-mortem, and fix the underlying gap.

## 7. Meetings aren't just meetings

Most of your communication isn't about the topic of the meeting. It's about establishing trust. Show up on time, take notes, follow up on action items. Junior engineers who do this consistently get promoted faster than peers with stronger pure-coding skills.

## 8. Find a mentor inside the company

Your bootcamp / college / online course got you in the door. The person who teaches you how *this specific company* works gets you to your second job. Ask someone two or three years ahead of you for a 30-minute coffee. Most will say yes.

## 9. Take breaks. Sleep. Touch grass.

You will not out-grind your colleagues into a promotion in your first year. You will burn out. Sustainable pace beats heroic sprints over any timescale longer than six weeks.

The first year is the hardest because everything is new at once: the codebase, the team, the office norms, the imposter syndrome. By month nine, most of it becomes routine. By month twelve, you'll be the one onboarding the next new hire.

Show up. Pay attention. Be kind. The rest works itself out.`,
  },
];
