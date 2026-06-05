import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  createPost,
  deletePost,
  getPostById,
  listPostsAdmin,
  updatePost,
} from "../blogs.js";
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
} from "../schemas/index.js";

const router = Router();

router.use(requireAdmin);

router.get("/", asyncHandler(async (_req, res) => {
  const posts = await listPostsAdmin();
  res.json({ ok: true, posts });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const post = await getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ ok: false, error: "Post not found" });
  }
  res.json({ ok: true, post });
}));

router.post("/", validate(blogPostCreateSchema), asyncHandler(async (req, res) => {
  const post = await createPost(req.body);
  res.json({ ok: true, post });
}));

router.patch("/:id", validate(blogPostUpdateSchema), asyncHandler(async (req, res) => {
  const post = await updatePost(req.params.id, req.body);
  if (!post) {
    return res.status(404).json({ ok: false, error: "Post not found" });
  }
  res.json({ ok: true, post });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const deleted = await deletePost(req.params.id);
  if (!deleted) {
    return res.status(404).json({ ok: false, error: "Post not found" });
  }
  res.json({ ok: true });
}));

export default router;
