import { isElectronProduction } from './envUtils';

// Utility function to convert game texture paths to web paths
// Supports both path formats:
// 1. Content/Characters/Human/...
// 2. %ModDir%/Content/Characters/Human/...
export const convertTexturePath = (texturePath, gender) => {
  if (!texturePath) return '';
  
  // Replace [GENDER] placeholder with actual gender
  let convertedPath = texturePath.replace(/\[gender\]/gi, gender);
  
  // Remove %ModDir%/ or %moddir%/ or %moddir:xxxxxxxx%/ (case-insensitive) if present
  convertedPath = convertedPath.replace(/^%moddir(?::\d+)?%\//i, '');

  // Convert any Content/xxx to the appropriate path
  if (convertedPath.startsWith('Content/')) {
    if (isElectronProduction()) {
      // In Electron production, use assets:// protocol
      convertedPath = convertedPath.replace('Content/', 'assets://Content/');
    } else {
      // In development or web, use /assets/ path
      convertedPath = convertedPath.replace('Content/', '/assets/Content/');
    }
  }
  
  // If the path doesn't start with the correct prefix but contains Content/, add the prefix
  if (!convertedPath.startsWith('/assets/') && !convertedPath.startsWith('assets://') && convertedPath.includes('Content/')) {
    if (isElectronProduction()) {
      convertedPath = `assets://${convertedPath}`;
    } else {
      convertedPath = `/assets/${convertedPath}`;
    }
  }
  
  return convertedPath;
};

/**
 * Converts texture path with fallback logic for missing UnderwearTexture
 * @param {string} texturePath - The original texture path
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {string} - The processed texture path with fallback
 */
export const convertTexturePathWithFallback = (texturePath, gender) => {
  if (!texturePath) return '';
  
  // Replace [GENDER] placeholder with actual gender
  let convertedPath = texturePath.replace(/\[gender\]/gi, gender);
  
  // Special fallback logic for UnderwearTexture paths - handle this first
  if (convertedPath.includes('UnderwearTexture/Human_')) {
    // Replace UnderwearTexture with Content/Characters/Human for fallback
    convertedPath = convertedPath.replace('UnderwearTexture/Human_', 'Content/Characters/Human/Human_');
    console.log(`UnderwearTexture fallback: ${texturePath} -> ${convertedPath}`);
  }
  
  // Remove %ModDir%/ or %moddir%/ or %moddir:xxxxxxxx%/ (case-insensitive) if present
  convertedPath = convertedPath.replace(/^%moddir(?::\d+)?%\//i, '');

  // Convert any Content/xxx to the appropriate path
  if (convertedPath.startsWith('Content/')) {
    if (isElectronProduction()) {
      // In Electron production, use assets:// protocol
      convertedPath = convertedPath.replace('Content/', 'assets://Content/');
    } else {
      // In development or web, use /assets/ path
      convertedPath = convertedPath.replace('Content/', '/assets/Content/');
    }
  }
  
  // If the path doesn't start with the correct prefix but contains Content/, add the protocol
  if (!convertedPath.startsWith('/assets/') && !convertedPath.startsWith('assets://') && convertedPath.includes('Content/')) {
    if (isElectronProduction()) {
      convertedPath = `assets://${convertedPath}`;
    } else {
      convertedPath = `/assets/${convertedPath}`;
    }
  }
  
  return convertedPath;
};

/**
 * Converts a texture path to a blob URL in Electron production environment
 * @param {string} texturePath - The texture path (e.g., 'assets://Content/Characters/Human/Human_female.png')
 * @returns {Promise<string>} - The blob URL
 */
export const convertTexturePathToBlobUrl = async (texturePath) => {
  if (!texturePath) return '';
  
  if (isElectronProduction() && texturePath.startsWith('assets://')) {
    try {
      // Extract the relative path
      const relativePath = texturePath.replace('assets://', '');
      
      // Use Electron API to read the file as buffer
      if (window.electronAPI && window.electronAPI.readFileAsBuffer) {
        const bufferArray = await window.electronAPI.readFileAsBuffer(relativePath);
        const buffer = new Uint8Array(bufferArray);
        const blob = new Blob([buffer], { type: 'image/png' });
        return URL.createObjectURL(blob);
      } else {
        console.error('Electron API not available for reading binary files');
        return texturePath; // Fallback to original path
      }
    } catch (error) {
      console.error('Error converting texture path to blob URL:', error);
      return texturePath; // Fallback to original path
    }
  }
  
  // Return original path for development or non-Electron environments
  return texturePath;
};

// Test cases for the convertTexturePath function:
// convertTexturePath('Content/Characters/Human/Human_[GENDER].png', 'female') 
//   -> '/assets/Content/Characters/Human/Human_female.png'
// convertTexturePath('%ModDir%/Content/Characters/Human/Human_[GENDER].png', 'male') 
//   -> '/assets/Content/Characters/Human/Human_male.png'
// convertTexturePath('%moddir%/Content/Characters/Human/Human_[GENDER].png', 'male') 
//   -> '/assets/Content/Characters/Human/Human_male.png'
// convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', 'female') 
//   -> '/assets/Content/Characters/Human/Human_female_heads.png' 