const { auth } = require('../config/firebase');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify token with Firebase
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if user exists in our DB, if not create them
    let user = await prisma.user.findUnique({
      where: { email: decodedToken.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split('@')[0],
          role: decodedToken.email === 'admin@gaurangjadoun.in' ? 'ADMIN' : 'USER',
        }
      });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Forbidden: Your account has been banned' });
    }

    // Attach user to req.user
    req.user = {
      id: user.id, // DB user ID
      uid: decodedToken.uid, // Firebase UID
      email: decodedToken.email,
      name: user.name,
      role: user.role, // Use DB role for RBAC logic
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// RBAC Middleware
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
