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

  // Convert any Content/xxx to /assets/Content/xxx
  if (convertedPath.startsWith('Content/')) {
    convertedPath = convertedPath.replace('Content/', '/assets/Content/');
  }
  
  // If the path doesn't start with /assets/ but contains Content/, add the prefix
  if (!convertedPath.startsWith('/assets/') && convertedPath.includes('Content/')) {
    convertedPath = `/assets/${convertedPath}`;
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

  // Convert any Content/xxx to /assets/Content/xxx
  if (convertedPath.startsWith('Content/')) {
    convertedPath = convertedPath.replace('Content/', '/assets/Content/');
  }
  
  // If the path doesn't start with /assets/ but contains Content/, add the prefix
  if (!convertedPath.startsWith('/assets/') && convertedPath.includes('Content/')) {
    convertedPath = `/assets/${convertedPath}`;
  }
  
  return convertedPath;
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