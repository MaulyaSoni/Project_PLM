const ROLES = {
  ADMIN: 'ADMIN',
  ENGINEERING: 'ENGINEERING',
  APPROVER: 'APPROVER',
  OPERATIONS: 'OPERATIONS',
};

const authorize = (allowedRoles, message = 'Forbidden') => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return res.status(500).json({ error: 'Role policy is misconfigured' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: message });
    }
    return next();
  };
};

module.exports = { authorize, ROLES };
