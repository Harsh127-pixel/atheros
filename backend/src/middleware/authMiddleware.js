const { auth } = require('../config/firebase');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Logic: Check for Legacy API Key first (easier for manual testing)
  if (token && token === process.env.RENDER_API_KEY) {
    let systemUser;
    try {
      systemUser = await prisma.user.upsert({
        where: { email: 'system@aetheros.io' },
        update: {},
        create: {
          id: 'system-agent-007',
          email: 'system@aetheros.io',
          role: 'ADMIN',
          name: 'AetherOS System Controller'
        }
      });
    } catch (e) {
      console.error('Database unreachable in authMiddleware, using fallback system user');
      systemUser = {
        id: 'system-agent-007',
        email: 'system@aetheros.io',
        role: 'ADMIN',
        name: 'AetherOS System Controller (Fallback)'
      };
    }
    
    req.user = systemUser;
    return next();
  }

  try {
    // Verify token with Firebase
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user exists in our DB, if not create them
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: decodedToken.email }
      });

      if (!user) {
        const adminEmails = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim()) : [];
        const isSystemAdmin = adminEmails.includes(decodedToken.email);
        
        user = await prisma.user.create({
          data: {
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email.split('@')[0],
            role: isSystemAdmin ? 'ADMIN' : 'USER',
          }
        });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'Forbidden: Your account has been banned' });
      }
    } catch (dbError) {
      console.error('Database connection failed in authMiddleware, using stateless fallback user');
      const adminEmails = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim()) : [];
      const isSystemAdmin = adminEmails.includes(decodedToken.email);

      user = {
        id: 'fallback-' + decodedToken.uid.slice(0, 8),
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        role: isSystemAdmin ? 'ADMIN' : 'USER',
        isBanned: false
      };
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
