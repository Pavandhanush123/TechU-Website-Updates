import { getSession } from "../auth.js";

export const requireAuth = async (req, res, next) => {
  try {
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({
        ok: false,
        error: "Not signed in",
        timestamp: new Date().toISOString()
      });
    }
    // Attach session info to req for downstream usage
    req.userId = session.userId;
    req.email = session.email;
    req.isAdmin = session.isAdmin;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const session = await getSession(req, res);
    if (!session.isAdmin) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized: Admins only",
        timestamp: new Date().toISOString()
      });
    }
    // Attach session info to req for downstream usage
    req.userId = session.userId;
    req.email = session.email;
    req.isAdmin = session.isAdmin;
    next();
  } catch (err) {
    next(err);
  }
};
