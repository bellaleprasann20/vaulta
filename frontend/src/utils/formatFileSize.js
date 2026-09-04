/**
 * Formats a given number of bytes into a human-readable string.
 * @param {number} bytes - The file size in bytes.
 * @param {number} decimals - Number of decimal points to show.
 * @returns {string} - Formatted size (e.g., "2.4 MB").
 */
export const formatFileSize = (bytes, decimals = 1) => {
  if (bytes === 0 || !bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};