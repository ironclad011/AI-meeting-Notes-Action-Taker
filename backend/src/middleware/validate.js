const { ZodError } = require('zod');

/**
 * Higher-order middleware function to validate req.body against a Zod schema.
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const issueMessage = err.errors.map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: {
          message: issueMessage || 'Invalid request payload.',
        },
      });
    }
    next(err);
  }
};

module.exports = validate;
