/**
 * Time utility functions for IoT module
 * Uses seconds_ago from backend to avoid timezone issues
 */

/**
 * Format seconds ago for display
 * Uses seconds_ago from backend to avoid timezone issues
 * @param {number|null} secondsAgo - Seconds since last update (from backend)
 * @returns {string} - Formatted time string
 */
export const formatSecondsAgo = (secondsAgo) => {
  if (secondsAgo === null || secondsAgo === undefined) return 'Unknown';

  // Handle negative values (shouldn't happen, but just in case)
  if (secondsAgo < 0) return 'just now';

  if (secondsAgo < 60) {
    return 'just now';
  }

  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m ago` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

/**
 * Format seconds ago for short display (compact format)
 * @param {number|null} secondsAgo - Seconds since last update (from backend)
 * @returns {string} - Short formatted time string
 */
export const formatSecondsAgoShort = (secondsAgo) => {
  if (secondsAgo === null || secondsAgo === undefined) return '?';

  if (secondsAgo < 0) return 'now';
  if (secondsAgo < 60) return 'now';

  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
};
