const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const actual = String(req.user.role || "").toLowerCase().trim();
    const required = String(requiredRole || "").toLowerCase().trim();
    if (actual !== required) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports = roleMiddleware;