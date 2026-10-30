import ApiError from "../utils/api-error.js";

// Konversi ZodError → daftar errors [{field, message}]
function toErrors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

// Pabrik middleware: validasi req.body atau req.query dengan schema Zod.
// Data hasil parse (yang valid) ditulis kembali ke request.
function makeValidator(source) {
  return (schema) => (req, _res, next) => {
    const parsed = schema.safeParse(req[source] ?? {});

    if (!parsed.success) {
      next(new ApiError(400, "Validasi gagal", toErrors(parsed.error)));
      return;
    }

    if (source === "query") Object.assign(req.query, parsed.data);
    else req.body = parsed.data;
    next();
  };
}

// Validasi req.body — data bersih diteruskan di req.body
export default makeValidator("body");

// Validasi req.query (filter/paginasi) — key asing diabaikan zod secara default
export const validateQuery = makeValidator("query");
