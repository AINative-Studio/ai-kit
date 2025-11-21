/**
 * Simple ID generator utility
 */

let idCounter = 0;

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  const timestamp = Date.now();
  const counter = ++idCounter;
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${counter}-${random}`;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
