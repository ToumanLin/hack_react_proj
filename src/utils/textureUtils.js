// Utility function to convert game texture paths to web paths
// Supports both path formats:
// 1. Content/Characters/Human/...
// 2. %ModDir%/Content/Characters/Human/...
export const convertTexturePath = (texturePath, gender) => {
  if (!texturePath) return '';
  
  // Replace [GENDER] placeholder with actual gender
  let convertedPath = texturePath.replace('[GENDER]', gender);
  
  // Handle both path formats:
  // 1. Content/Characters/Human/...
  // 2. %ModDir%/Content/Characters/Human/...
  if (convertedPath.startsWith('%ModDir%/')) {
    convertedPath = convertedPath.replace('%ModDir%/', '');
  }
  
  // Convert to web path
  convertedPath = convertedPath.replace('Content/Characters/Human/', '/assets/Content/Characters/Human/');
  
  return convertedPath;
};

// Test cases for the convertTexturePath function:
// convertTexturePath('Content/Characters/Human/Human_[GENDER].png', 'female') 
//   -> '/assets/Content/Characters/Human/Human_female.png'
// convertTexturePath('%ModDir%/Content/Characters/Human/Human_[GENDER].png', 'male') 
//   -> '/assets/Content/Characters/Human/Human_male.png'
// convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', 'female') 
//   -> '/assets/Content/Characters/Human/Human_female_heads.png' 