const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('../utils/logger');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  if (!serviceAccount.privateKey || serviceAccount.privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
    logger.error('CRITICAL: Firebase Private Key is missing or invalid in environment variables.');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin SDK initialized successfully.');
    } catch (e) {
      logger.error('Firebase Admin Initialization Failed', e);
    }
  }
}

const auth = admin.auth();

module.exports = { admin, auth };
