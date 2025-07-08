import { isElectronProduction } from './envUtils';

const processPath = (path, gender) => {
  if (!path) return '';
  
  let convertedPath = path.replace(/\[gender\]/gi, gender);
  convertedPath = convertedPath.replace(/^%moddir(?::\d+)?%\//i, '');

  if (convertedPath.startsWith('Content/')) {
    if (isElectronProduction()) {
      convertedPath = convertedPath.replace('Content/', 'assets://Content/');
    } else {
      convertedPath = convertedPath.replace('Content/', '/assets/Content/');
    }
  } else if (!convertedPath.startsWith('/assets/') && !convertedPath.startsWith('assets://') && convertedPath.includes('Content/')) {
    if (isElectronProduction()) {
      convertedPath = `assets://${convertedPath}`;
    } else {
      convertedPath = `/assets/${convertedPath}`;
    }
  }
  
  return convertedPath;
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
  
  if (isElectronProduction() && texturePath.startsWith('assets://')) {
    try {
      const relativePath = texturePath.replace('assets://', '');
      
      if (window.electronAPI && window.electronAPI.readFileAsBuffer) {
        const bufferArray = await window.electronAPI.readFileAsBuffer(relativePath);
        const buffer = new Uint8Array(bufferArray);
        const blob = new Blob([buffer], { type: 'image/png' });
        return URL.createObjectURL(blob);
      } else {
        console.error('Electron API not available for reading binary files');
        return texturePath;
      }
    } catch (error) {
      console.error('Error converting texture path to blob URL:', error);
      return texturePath;
    }
  }
  
  return texturePath;
};