export const isAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin email whitelist
    const ADMIN_EMAILS = [
      'unitradecargo@gmail.com'
    ];

    // Check if current user's email is in admin list
    if (!ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};