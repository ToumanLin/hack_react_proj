import { isElectronProduction } from './envUtils';

const processPath = (path, gender) => {
  if (!path) return '';
  
  let convertedPath = path.replace(/\[gender\]/gi, gender);
  convertedPath = convertedPath.replace(/^%moddir(?::\d+)?%\//i, '');

  if (isElectronProduction()) {
    // In prod, we need the path relative to the assets dir, e.g., "Content/Characters/Human/Human_male.png"
    return convertedPath;
  } else {
    // In dev, we need a web-accessible URL
    if (convertedPath.startsWith('Content/')) {
      return `/assets/${convertedPath}`;
    } else if (!convertedPath.startsWith('/assets/')) {
      // Fallback for paths that might not have the Content/ prefix but should be in assets
      return `/assets/${convertedPath}`;
    }
    return convertedPath;
  }
};

export const convertTexturePath = (texturePath, gender) => {
  return processPath(texturePath, gender);
};

export const convertTexturePathWithFallback = (texturePath, gender) => {
  if (!texturePath) return '';
  
  let pathWithFallback = texturePath;
  if (pathWithFallback.includes('UnderwearTexture/Human_')) {
    pathWithFallback = pathWithFallback.replace('UnderwearTexture/Human_', 'Content/Characters/Human/Human_');
    console.log(`UnderwearTexture fallback: ${texturePath} -> ${pathWithFallback}`);
  }
  
  return processPath(pathWithFallback, gender);
};

export const convertTexturePathToBlobUrl = async (texturePath) => {
  if (!texturePath) return '';
  
  // In production, texturePath should be a relative path inside the assets directory
  if (isElectronProduction()) {
    try {
      if (window.electronAPI && window.electronAPI.readFileAsBuffer) {
        // Pass the relative path directly to the API
        const buffer = await window.electronAPI.readFileAsBuffer(texturePath);
        const blob = new Blob([buffer], { type: 'image/png' });
        return URL.createObjectURL(blob);
      } else {
        console.error('Electron API for reading binary files is not available.');
        return ''; // Return empty to avoid broken image icons
      }
    } catch (error) {
      console.error(`Error converting texture path "${texturePath}" to blob URL:`, error);
      return '';
    }
  }
  
  // In development, texturePath is a direct URL
  return texturePath;
};