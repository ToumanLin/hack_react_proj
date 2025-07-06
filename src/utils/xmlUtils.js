/**
 * XML parsing utility functions
 * Handles inconsistencies in attribute name casing in XML files
 */

/**
 * Retrieves an attribute value from a DOM element, supporting multiple case variants
 * @param {Element} element - XML element
 * @param {string} baseName - Base attribute name (lowercase)
 * @param {string} defaultValue - Default value
 * @returns {string|null} Attribute value
 */
export const getAttribute = (element, baseName, defaultValue = null) => {
  if (!element) return defaultValue;
  
  // Try multiple case variants
  const variants = [
    baseName,                    // Original name
    baseName.toLowerCase(),      // All lowercase
    baseName.toUpperCase(),      // All uppercase
    baseName.charAt(0).toUpperCase() + baseName.slice(1), // First letter uppercase
    baseName.charAt(0).toLowerCase() + baseName.slice(1), // First letter lowercase
  ];
  
  // For compound words, also try camel case
  if (baseName.includes('source') && baseName.includes('rect')) {
    variants.push('sourceRect', 'SourceRect', 'sourcerect', 'SourceRect');
  }
  if (baseName.includes('sheet') && baseName.includes('index')) {
    variants.push('sheetIndex', 'SheetIndex', 'sheetindex', 'SheetIndex');
  }
  if (baseName.includes('limb') && baseName.includes('anchor')) {
    variants.push('limbAnchor', 'LimbAnchor', 'limbanchor', 'LimbAnchor');
  }
  if (baseName === 'texture') {
    variants.push('Texture');
  }
  
  // Remove duplicates
  const uniqueVariants = [...new Set(variants)];
  
  for (const variant of uniqueVariants) {
    const value = element.getAttribute(variant);
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  
  return defaultValue;
};

/**
 * Retrieves an attribute value from a xml2js object, supporting multiple case variants
 * @param {Object} obj - xml2js object
 * @param {string} baseName - Base attribute name (lowercase)
 * @param {string} defaultValue - Default value
 * @returns {string|null} Attribute value
 */
export const getXml2jsAttribute = (obj, baseName, defaultValue = null) => {
  if (!obj || !obj.$) return defaultValue;
  
  // Try multiple case variants
  const variants = [
    baseName,                    // Original name
    baseName.toLowerCase(),      // All lowercase
    baseName.toUpperCase(),      // All uppercase
    baseName.charAt(0).toUpperCase() + baseName.slice(1), // First letter uppercase
    baseName.charAt(0).toLowerCase() + baseName.slice(1), // First letter lowercase
  ];
  
  // For compound words, also try camel case
  if (baseName.includes('source') && baseName.includes('rect')) {
    variants.push('sourceRect', 'SourceRect', 'sourcerect', 'SourceRect');
  }
  if (baseName.includes('sheet') && baseName.includes('index')) {
    variants.push('sheetIndex', 'SheetIndex', 'sheetindex', 'SheetIndex');
  }
  if (baseName.includes('limb') && baseName.includes('anchor')) {
    variants.push('limbAnchor', 'LimbAnchor', 'limbanchor', 'LimbAnchor');
  }
  // For texture attribute, add special handling
  if (baseName === 'texture') {
    variants.push('Texture', 'TEXTURE');
  }
  
  // Remove duplicates
  const uniqueVariants = [...new Set(variants)];
  
  for (const variant of uniqueVariants) {
    const value = obj.$[variant];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  
  return defaultValue;
};

/**
 * Parses a comma-separated array of numbers, supports decimals and removes whitespace
 * @param {string} value - Comma-separated numeric string
 * @param {Array} defaultValue - Default value
 * @returns {Array<number>} Parsed numeric array
 */
export const parseNumberArray = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  
  try {
    return value.split(',').map(val => parseFloat(val.trim()));
  } catch (error) {
    console.warn('Failed to parse number array:', value, error);
    return defaultValue;
  }
};

/**
 * Parses a boolean value, supports multiple representations
 * @param {string} value - Boolean string
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} Parsed boolean value
 */
export const parseBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined) return defaultValue;
  
  const lowerValue = value.toLowerCase().trim();
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'True';
};

/**
 * Parses a float number
 * @param {string} value - Numeric string
 * @param {number} defaultValue - Default value
 * @returns {number} Parsed float number
 */
export const parseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parses sprite attributes from an XML element
 * @param {Element} spriteElement - Sprite XML element
 * @returns {Object} Parsed sprite object
 */
export const parseSpriteAttributes = (spriteElement) => {
  if (!spriteElement) return null;
  
  // Check if inheritscale attribute is defined
  const hasInheritScale = getAttribute(spriteElement, 'inheritscale', null) !== null;
  
  return {
    name: getAttribute(spriteElement, 'name', ''),
    texture: getAttribute(spriteElement, 'texture', ''),
    limb: getAttribute(spriteElement, 'limb', ''),
    hidelimb: parseBoolean(getAttribute(spriteElement, 'hidelimb', 'false')),
    depthLimb: getAttribute(spriteElement, 'depthlimb', null),
    inheritLimbDepth: parseBoolean(getAttribute(spriteElement, 'inheritlimbdepth', 'true')),
    depth: parseFloat(getAttribute(spriteElement, 'depth', null)),
    inheritTextureScale: hasInheritScale ? false : parseBoolean(getAttribute(spriteElement, 'inherittexturescale', 'false')),
    scale: parseFloat(getAttribute(spriteElement, 'scale', '1.0')),
    inheritOrigin: parseBoolean(getAttribute(spriteElement, 'inheritorigin', 'false')),
    origin: parseNumberArray(getAttribute(spriteElement, 'origin', null)),
    inheritSourceRect: parseBoolean(getAttribute(spriteElement, 'inheritsourcerect', 'false')),
    sourceRect: parseNumberArray(getAttribute(spriteElement, 'sourcerect', null)),
    ignoreLimbScale: parseBoolean(getAttribute(spriteElement, 'ignorelimbscale', 'false')),
    ignoreRagdollScale: parseBoolean(getAttribute(spriteElement, 'ignoreragdollscale', 'false')),
    inheritScale: hasInheritScale ? parseBoolean(getAttribute(spriteElement, 'inheritscale', 'true')) : true,
    hideOtherWearables: parseBoolean(getAttribute(spriteElement, 'hideotherwearables', 'false')),
    hideWearablesOfType: getAttribute(spriteElement, 'hidewearablesoftype', ''),
    rotation: parseFloat(getAttribute(spriteElement, 'rotation', '0')),
    useLegacyScaleLogic: !hasInheritScale,
  };
};

/**
 * Parses sprite attributes from an xml2js object
 * @param {Object} spriteObj - xml2js parsed sprite object
 * @returns {Object} Parsed sprite object
 */
export const parseSpriteAttributesFromXml2js = (spriteObj) => {
  if (!spriteObj || !spriteObj.$) return null;
  
  // Check if inheritscale attribute is defined
  const hasInheritScale = getXml2jsAttribute(spriteObj, 'inheritscale', null) !== null;
  
  return {
    name: getXml2jsAttribute(spriteObj, 'name', ''),
    texture: getXml2jsAttribute(spriteObj, 'texture', ''),
    limb: getXml2jsAttribute(spriteObj, 'limb', ''),
    hidelimb: parseBoolean(getXml2jsAttribute(spriteObj, 'hidelimb', 'false')),
    depthLimb: getXml2jsAttribute(spriteObj, 'depthlimb', null),
    inheritLimbDepth: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritlimbdepth', 'true')),
    depth: parseFloat(getXml2jsAttribute(spriteObj, 'depth', null)),
    inheritTextureScale: hasInheritScale ? false : parseBoolean(getXml2jsAttribute(spriteObj, 'inherittexturescale', 'false')),
    scale: parseFloat(getXml2jsAttribute(spriteObj, 'scale', '1.0')),
    inheritOrigin: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritorigin', 'false')),
    origin: parseNumberArray(getXml2jsAttribute(spriteObj, 'origin', null)),
    inheritSourceRect: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritsourcerect', 'false')),
    sourceRect: parseNumberArray(getXml2jsAttribute(spriteObj, 'sourcerect', null)),
    ignoreLimbScale: parseBoolean(getXml2jsAttribute(spriteObj, 'ignorelimbscale', 'false')),
    ignoreRagdollScale: parseBoolean(getXml2jsAttribute(spriteObj, 'ignoreragdollscale', 'false')),
    inheritScale: hasInheritScale ? parseBoolean(getXml2jsAttribute(spriteObj, 'inheritscale', 'true')) : true,
    hideOtherWearables: parseBoolean(getXml2jsAttribute(spriteObj, 'hideotherwearables', 'false')),
    hideWearablesOfType: getXml2jsAttribute(spriteObj, 'hidewearablesoftype', ''),
    rotation: parseFloat(getXml2jsAttribute(spriteObj, 'rotation', '0')),
    useLegacyScaleLogic: !hasInheritScale,
  };
};

/**
 * Parses limb attributes from an XML element
 * @param {Element} limbElement - Limb XML element
 * @returns {Object} Parsed limb object
 */
export const parseLimbAttributes = (limbElement) => {
  if (!limbElement) return null;
  
  return {
    id: getAttribute(limbElement, 'id', ''),
    name: getAttribute(limbElement, 'name', ''),
    type: getAttribute(limbElement, 'type', ''),
    scale: parseFloat(getAttribute(limbElement, 'scale', '1')),
    depth: parseFloat(getAttribute(limbElement, 'depth', '0')),
    origin: parseNumberArray(getAttribute(limbElement, 'origin', '0.5,0.5')),
    sourceRect: parseNumberArray(getAttribute(limbElement, 'sourcerect', null)),
    texture: getAttribute(limbElement, 'texture', ''),
  };
};

/**
 * Parses limb attributes from an xml2js object
 * @param {Object} limbObj - xml2js parsed limb object
 * @returns {Object} Parsed limb object
 */
export const parseLimbAttributesFromXml2js = (limbObj) => {
  if (!limbObj || !limbObj.$) return null;
  
  return {
    id: getXml2jsAttribute(limbObj, 'id', ''),
    name: getXml2jsAttribute(limbObj, 'name', ''),
    type: getXml2jsAttribute(limbObj, 'type', ''),
    scale: parseFloat(getXml2jsAttribute(limbObj, 'scale', '1')),
    depth: parseFloat(getXml2jsAttribute(limbObj, 'depth', '0')),
    origin: parseNumberArray(getXml2jsAttribute(limbObj, 'origin', '0.5,0.5')),
    sourceRect: parseNumberArray(getXml2jsAttribute(limbObj, 'sourcerect', null)),
    texture: getXml2jsAttribute(limbObj, 'texture', ''),
  };
};

/**
 * Parses joint attributes from an XML element
 * @param {Element} jointElement - Joint XML element
 * @returns {Object} Parsed joint object
 */
export const parseJointAttributes = (jointElement) => {
  if (!jointElement) return null;
  
  return {
    limb1: getAttribute(jointElement, 'limb1', ''),
    limb2: getAttribute(jointElement, 'limb2', ''),
    limb1Anchor: parseNumberArray(getAttribute(jointElement, 'limb1anchor', '0,0')),
    limb2Anchor: parseNumberArray(getAttribute(jointElement, 'limb2anchor', '0,0')),
  };
};

/**
 * Parses joint attributes from an xml2js object
 * @param {Object} jointObj - xml2js parsed joint object
 * @returns {Object} Parsed joint object
 */
export const parseJointAttributesFromXml2js = (jointObj) => {
  if (!jointObj || !jointObj.$) return null;
  
  return {
    limb1: getXml2jsAttribute(jointObj, 'limb1', ''),
    limb2: getXml2jsAttribute(jointObj, 'limb2', ''),
    limb1Anchor: parseNumberArray(getXml2jsAttribute(jointObj, 'limb1anchor', '0,0')),
    limb2Anchor: parseNumberArray(getXml2jsAttribute(jointObj, 'limb2anchor', '0,0')),
  };
}; 