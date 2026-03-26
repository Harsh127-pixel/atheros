const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const maintenanceMiddleware = async (req, res, next) => {
  // Allow Health, Health Check, and Auth endpoints to pass through
  const bypassPaths = ['/health', '/api/admin/settings', '/api/me']; 
  if (bypassPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  try {
    const settings = await prisma.systemSettings.findFirst();

    if (settings && settings.maintenanceMode) {
      // Check if user is Admin, they can still access!
      if (req.user && req.user.role === 'ADMIN') {
        return next();
      }

      // If it's an admin endpoint, roleMiddleware will handle it anyway
      if (req.path.startsWith('/api/admin')) {
        return next();
      }

      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'AetherOS is currently undergoing maintenance. Please try again soon.',
        maintenance: true
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance Middleware Error:', error);
    next(); // Fail-safe: let traffic through if DB is down or something
  }
};

module.exports = { maintenanceMiddleware };
