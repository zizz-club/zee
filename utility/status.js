// status.js
import { ActivityType } from 'discord.js';
import { logger } from './logger.js';

let statusRotationTimeout = null;
let statusRotationIndex = 0;

/**
 * Set the bot's status and activity message, with rate limit protection.
 * Accepts either individual arguments or a single object with message, status, and type.
 *
 * @param {import('discord.js').Client} client - The Discord client
 * @param {string|object} messageOrOptions - The status message string or an options object
 * @param {'online'|'idle'|'dnd'|'invisible'} [status='online'] - The bot's status
 * @param {ActivityType} [type=ActivityType.Playing] - The activity type (default: Playing)
 */
export async function setBotStatus(client, messageOrOptions, status = 'online', type = ActivityType.Playing) {
  let message;
  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    message = String(messageOrOptions.message ?? '');
    status = messageOrOptions.status ?? status;
    if (typeof messageOrOptions.type === 'number') {
      type = messageOrOptions.type;
    } else if (typeof messageOrOptions.type === 'string' && ActivityType[messageOrOptions.type] !== undefined) {
      type = ActivityType[messageOrOptions.type];
    }
  } else {
    message = String(messageOrOptions ?? '');
  }
  try {
    if (client.user) {
      logger.debug('Setting bot status', { message, status, type });
      await client.user.setPresence({
        activities: [{ name: message, type }],
        status,
      });
    } else {
      logger.warn('Tried to set status but client.user is not available');
    }
  } catch (err) {
    if (err.code === 50013 || (err.status && err.status === 429)) {
      logger.debug('Skipping status update due to Discord rate limit', { message, status, type });
      const retryAfter = (err.retry_after ? Math.ceil(err.retry_after * 1000) : 6000);
      globalThis.pendingStatus = { client, message, status, type };
      if (!globalThis.pendingTimeout) {
        globalThis.pendingTimeout = setTimeout(async () => {
          if (globalThis.pendingStatus) {
            const { client, message, status, type } = globalThis.pendingStatus;
            globalThis.pendingStatus = null;
            globalThis.pendingTimeout = null;
            await setBotStatus(client, message, status, type);
          }
        }, retryAfter);
      }
    } else {
      logger.error('Failed to set bot status:', err);
    }
  }
}

/**
 * Start rotating bot statuses from a list, with dynamic interval adjustment on rate limit.
 * If only one status is provided, sets it once and does not rotate.
 *
 * @param {import('discord.js').Client} client - The Discord client
 * @param {Array} statuses - Array of status objects { message, status, type }
 * @param {number} interval - Default interval in ms
 */
export function startStatusRotation(client, statuses, interval = 15000) {
  if (!Array.isArray(statuses) || statuses.length === 0) return;
  if (statusRotationTimeout) clearTimeout(statusRotationTimeout);
  statusRotationIndex = 0;

  if (statuses.length === 1) {
    logger.info('Only one status provided, setting status once and not rotating.');
    setBotStatus(client, statuses[0]);
    return;
  }

  logger.info(`Status rotation started: rotating through ${statuses.length} statuses every ${interval}ms.`);
  async function rotate() {
    const status = statuses[statusRotationIndex % statuses.length];
    try {
      await setBotStatus(client, status);
    } catch (err) {
      if (err && (err.code === 50013 || (err.status && err.status === 429))) {
        const retryAfter = (err.retry_after ? Math.ceil(err.retry_after * 1000) : interval * 2);
        logger.warn('Rate limited while rotating status, increasing interval', { retryAfter });
        statusRotationTimeout = setTimeout(rotate, retryAfter);
        return;
      } else {
        logger.error('Failed to rotate bot status:', err);
      }
    }
    statusRotationIndex = (statusRotationIndex + 1) % statuses.length;
    statusRotationTimeout = setTimeout(rotate, interval);
  }
  rotate();
}

/**
 * Stop rotating bot statuses.
 */
export function stopStatusRotation() {
  if (statusRotationTimeout) clearTimeout(statusRotationTimeout);
  statusRotationTimeout = null;
}
