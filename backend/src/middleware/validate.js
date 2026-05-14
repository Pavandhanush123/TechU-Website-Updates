export const validate = (schema, source = "body") => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      timestamp: new Date().toISOString(),
    });
  }
  req[source] = parsed.data; // Assign parsed data (strips unknown fields if schema uses strict/strip)
  next();
};
