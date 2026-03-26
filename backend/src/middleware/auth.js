const logger = require('../utils/logger');

const apiKeyAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.split(' ')[1];
    const systemApiKey = process.env.RENDER_API_KEY;

    if (!apiKey || apiKey !== systemApiKey) {
        logger.warn('Unauthorized access attempt detected', { 
            ip: req.ip, 
            path: req.path,
            method: req.method
        });
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    next();
};

module.exports = { apiKeyAuth };
