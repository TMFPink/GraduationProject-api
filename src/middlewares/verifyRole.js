// middlewares/verifyRole.middleware.js
const { ForbiddenRequestError } = require('../core/error.response');

const ROLE_MAP = {
  '00000000-0000-0000-0000-000000000001': 'admin',
  '00000000-0000-0000-0000-000000000002': 'user',
};

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    const roleId = req.user?.role_id;
    const userRole = ROLE_MAP[roleId];

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ForbiddenRequestError(
        'You do not have permission to access this resource'
      );
    }

    next();
  };
};

module.exports = { verifyRole };
