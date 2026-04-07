// Middleware to block users whose status is not ACTIVE
module.exports = (req, res, next) => {
  if (!req.user || req.user.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'Your account is not approved/active.' });
  }
  next();
};
