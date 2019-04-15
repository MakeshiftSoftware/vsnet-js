const jwt = require('jsonwebtoken');
const { BadRequestError, UnauthorizedError } = require('./errors');

const { APP_SECRET } = process.env;

const optionalAuth = (req, res, next) => {
  const token = req.headers.Authorization;

  if (!token) {
    next();
  } else {
    jwt.verify(token, APP_SECRET, (err, decoded) => {
      if (decoded) {
        req.user = decoded;
      }

      next();
    });
  }
};

const requireAuth = (req, res, next) => {
  const token = req.headers.Authorization;

  if (!token) {
    throw new UnauthorizedError();
  }

  jwt.verify(token, APP_SECRET, (err, decoded) => {
    if (decoded) {
      req.user = decoded;
      next();
    } else {
      throw new UnauthorizedError();
    }
  });
};

const validateRequest = config => (req, res, next) => {
  try {
    const errors = [];
    const params = Object.keys(config);

    for (let i = 0; i < params.length; ++i) {
      const paramName = params[i];
      const paramConfig = config[paramName];
      let paramValue = req.query[paramName];

      if (paramValue === undefined) {
        if (paramConfig.required === true && paramConfig.defaultValue === undefined) {
          errors.push(`query parameter '${paramName}' is required`);
          continue;
        } else {
          paramValue = paramConfig.defaultValue;
        }
      }

      // run validation function if provided
      if (paramConfig.validate && paramConfig.validate(paramValue) === false) {
        errors.push(`invalid value '${paramValue}' for query parameter '${paramName}'`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError('Invalid query parameters', errors);
    }

    next();
  } catch (e) {
    next(e);
  }
};

module.exports = {
  optionalAuth,
  requireAuth,
  validateRequest,
};
