import { Router } from "express";
import { getPostBySlug, listPostsPublic } from "../blogs.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// Strip body from list responses to keep payloads tight.
function withoutBody(post) {
  const { body: _body, ...rest } = post;
  return rest;
}

router.get("/", asyncHandler(async (_req, res) => {
  const posts = await listPostsPublic();
  res.json({ ok: true, posts: posts.map(withoutBody) });
}));

router.get("/:slug", asyncHandler(async (req, res) => {
  const post = await getPostBySlug(req.params.slug, { onlyPublished: true });
  if (!post) {
    return res.status(404).json({ ok: false, error: "Post not found" });
  }
  res.json({ ok: true, post });
}));

export default router;
