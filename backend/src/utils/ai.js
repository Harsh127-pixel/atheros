const logger = require('./logger');

/**
 * Executes a function with exponential backoff
 * @param {Function} fn - The async function to execute
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 */
const withRetry = async (fn, maxRetries = 3, baseDelay = 2000) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.status === 429;
      const isServiceUnavailable = error.message?.includes('503') || error.status === 503;
      
      if (attempt < maxRetries && (isRateLimit || isServiceUnavailable)) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Gemini API rate limit or error (Attempt ${attempt + 1}). Retrying in ${delay}ms...`, { error: error.message });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

module.exports = { withRetry };
