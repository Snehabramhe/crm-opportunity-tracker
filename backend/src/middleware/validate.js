/**
 * Validation middleware factory. Parses req.body against a Zod schema and
 * replaces it with the parsed (and stripped) result, so unknown fields such as
 * `owner` / `user_id` / `created_by` never reach controllers.
 */
const validate = (schema) => (req, res, next) => {
  const parsed = schema.parse(req.body);
  req.body = parsed;
  next();
};

export default validate;
