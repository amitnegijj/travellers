/**
 * Parses a request part against a Zod schema and replaces it with the parsed
 * value, so handlers downstream read validated, coerced data.
 *
 * A ZodError thrown here is translated to a 422 by the error middleware.
 */
export const validateBody = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateQuery = (schema) => (req, _res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (err) {
    next(err);
  }
};
