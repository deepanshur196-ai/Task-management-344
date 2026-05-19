import jwt from 'jsonwebtoken';

const auth = (roles = []) => {
  // roles param can be a single role string (e.g. 'Admin') or an array of roles
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length) {
        const isAdminRole = roles.includes('Admin');
        const canUseAdmin = isAdminRole && decoded.designation === 'Project Lead';
        if (!roles.includes(decoded.role) && !canUseAdmin) {
          return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

export default auth;
