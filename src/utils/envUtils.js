/**
 * Environment detection utilities for Electron applications
 */

/**
 * Check if we're running in Electron environment
 * @returns {boolean}
 */
export const isElectron = () => {
  return window && window.electronAPI;
};

/**
 * Check if we're in production environment (file:// protocol)
 * @returns {boolean}
 */
export const isProduction = () => {
  return window.location.protocol === 'file:' || window.location.href.includes('file://');
};

/**
 * Check if we're in Electron production environment
 * @returns {boolean}
 */
export const isElectronProduction = () => {
  return isElectron() && isProduction();
}; 