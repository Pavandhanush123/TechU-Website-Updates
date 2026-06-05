// Global error handler — Express calls this for any error passed to next(err)
// or thrown inside an asyncHandler-wrapped route.
//
// Prisma errors are mapped to safe HTTP responses so raw DB details never leak.

export const errorHandler = (err, _req, res, _next) => {
  // Prisma-specific error handling
  if (err.code === "P2002") {
    // Unique constraint violation
    const field = err.meta?.target?.[0] ?? "field";
    console.warn("Prisma unique constraint violation:", field);
    return res.status(409).json({
      ok: false,
      error: `A record with that ${field} already exists.`,
      code: "DUPLICATE_ENTRY",
      timestamp: new Date().toISOString(),
    });
  }
  if (err.code === "P2025") {
    // Record not found (update/delete on missing row)
    console.warn("Prisma record not found:", err.meta?.cause);
    return res.status(404).json({
      ok: false,
      error: "Record not found.",
      code: "NOT_FOUND",
      timestamp: new Date().toISOString(),
    });
  }
  if (err.code === "P2003") {
    // Foreign key constraint failure
    console.warn("Prisma foreign key violation:", err.meta?.field_name);
    return res.status(400).json({
      ok: false,
      error: "Related record not found.",
      code: "FK_VIOLATION",
      timestamp: new Date().toISOString(),
    });
  }

  // JSON parse error (malformed request body)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      ok: false,
      error: "Malformed JSON in request body.",
      code: "INVALID_JSON",
      timestamp: new Date().toISOString(),
    });
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      ok: false,
      error: "File too large.",
      code: "FILE_TOO_LARGE",
      timestamp: new Date().toISOString(),
    });
  }

  // Default: log full error in dev, send safe message in production
  console.error("Unhandled error:", err);

  if (res.headersSent) return;

  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    status < 500 || err.expose
      ? err.message
      : isProduction
        ? "Internal server error"
        : err.message || "Internal server error";

  res.status(status).json({
    ok: false,
    error: message,
    code: err.code || "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
  });
};

