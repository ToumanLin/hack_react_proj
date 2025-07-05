// Utility function to convert game texture paths to web paths
// Supports both path formats:
// 1. Content/Characters/Human/...
// 2. %ModDir%/Content/Characters/Human/...
export const convertTexturePath = (texturePath, gender) => {
  if (!texturePath) return '';
  
  // Replace [GENDER] placeholder with actual gender
  let convertedPath = texturePath.replace('[GENDER]', gender);
  
  // Remove %ModDir%/ if present
  if (convertedPath.startsWith('%ModDir%/')) {
    convertedPath = convertedPath.replace('%ModDir%/', '');
  }
  
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
// convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', 'female') 
//   -> '/assets/Content/Characters/Human/Human_female_heads.png' 