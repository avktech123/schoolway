const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'systemAdmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'System admin access required' 
    });
  }
  next();
};

const requireSchoolAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'schoolAdmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'School admin access required' 
    });
  }
  next();
};

// Middleware to check if user is parent
const requireParent = (req, res, next) => {
  if (!req.user || req.user.role !== 'parent') {
    return res.status(403).json({ 
      success: false, 
      message: 'Parent access required' 
    });
  }
  next();
};

// Middleware to check if user is student
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ 
      success: false, 
      message: 'Student access required' 
    });
  }
  next();
};

// Middleware to check admin role level
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !['systemAdmin', 'schoolAdmin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

// RBAC permissions
const permissions = {
  systemAdmin: [
    'create:schoolAdmin',
    'read:schoolAdmin',
    'update:schoolAdmin',
    'delete:schoolAdmin',
    'read:users',
    'update:userRole',
    'lock:user',
    'read:analytics:admin'
  ],
  schoolAdmin: [
    'create:parent',
    'create:student',
    'read:students',
    'update:student',
    'delete:student',
    'read:tracking',
    'update:tracking',
    'analytics:tracking',
    'export:students'
  ],
  parent: [
    'read:own:children',
    'read:tracking:own'
  ],
  student: []
};

const canPerform = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = req.user.role;
    const allowedActions = permissions[userRole] || [];
    if (!allowedActions.includes(action)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

const canPerformAny = (actions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = req.user.role;
    const allowedActions = permissions[userRole] || [];
    const ok = actions.some(action => allowedActions.includes(action));
    if (!ok) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Middleware to check if user can access specific school
const requireSchoolAccess = (schoolId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!req.user.canAccessSchool(schoolId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this school' 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireSystemAdmin,
  requireSchoolAdmin,
  requireParent,
  requireStudent,
  requireRole,
  permissions,
  canPerform,
  canPerformAny,
  requirePermission,
  requireSchoolAccess
};