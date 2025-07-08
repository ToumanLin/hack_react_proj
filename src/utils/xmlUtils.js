/**
 * XML parsing utility functions
 * Handles inconsistencies in attribute name casing in XML files
 */

const getAttributeVariants = (baseName) => {
  const variants = [
    baseName,
    baseName.toLowerCase(),
    baseName.toUpperCase(),
    baseName.charAt(0).toUpperCase() + baseName.slice(1),
    baseName.charAt(0).toLowerCase() + baseName.slice(1),
  ];

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

  return [...new Set(variants)];
};

const createAttributeGetter = (element) => (baseName, defaultValue = null) => {
  if (!element) return defaultValue;
  const variants = getAttributeVariants(baseName);
  for (const variant of variants) {
    const value = element.getAttribute(variant);
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return defaultValue;
};

const createXml2jsAttributeGetter = (obj) => (baseName, defaultValue = null) => {
  if (!obj || !obj.$) return defaultValue;
  const variants = getAttributeVariants(baseName);
  for (const variant of variants) {
    const value = obj.$[variant];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return defaultValue;
};

export const parseNumberArray = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  try {
    return value.split(',').map(val => parseFloat(val.trim()));
  } catch (error) {
    console.warn('Failed to parse number array:', value, error);
    return defaultValue;
  }
};

export const parseBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined) return defaultValue;
  const lowerValue = value.toLowerCase().trim();
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'True';
};

export const parseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const createAttributeParser = (attributeGetter) => (element) => {
  if (!element) return null;
  const get = attributeGetter(element);
  const hasInheritScale = get('inheritscale', null) !== null;
  return {
    name: get('name', ''),
    texture: get('texture', ''),
    limb: get('limb', ''),
    hidelimb: parseBoolean(get('hidelimb', 'false')),
    depthLimb: get('depthlimb', null),
    inheritLimbDepth: parseBoolean(get('inheritlimbdepth', 'true')),
    depth: parseFloat(get('depth', null)),
    inheritTextureScale: hasInheritScale ? false : parseBoolean(get('inherittexturescale', 'false')),
    scale: parseFloat(get('scale', '1.0')),
    inheritOrigin: parseBoolean(get('inheritorigin', 'false')),
    origin: parseNumberArray(get('origin', null)),
    inheritSourceRect: parseBoolean(get('inheritsourcerect', 'false')),
    sourceRect: parseNumberArray(get('sourcerect', null)),
    ignoreLimbScale: parseBoolean(get('ignorelimbscale', 'false')),
    ignoreRagdollScale: parseBoolean(get('ignoreragdollscale', 'false')),
    inheritScale: hasInheritScale ? parseBoolean(get('inheritscale', 'true')) : true,
    hideOtherWearables: parseBoolean(get('hideotherwearables', 'false')),
    hideWearablesOfType: get('hidewearablesoftype', ''),
    rotation: parseFloat(get('rotation', '0')),
    useLegacyScaleLogic: !hasInheritScale,
  };
};

export const parseSpriteAttributes = createAttributeParser(createAttributeGetter);
export const parseSpriteAttributesFromXml2js = createAttributeParser(createXml2jsAttributeGetter);

const createLimbAttributeParser = (attributeGetter) => (element) => {
  if (!element) return null;
  const get = attributeGetter(element);
  return {
    id: get('id', ''),
    name: get('name', ''),
    type: get('type', ''),
    scale: parseFloat(get('scale', '1')),
    depth: parseFloat(get('depth', '0')),
    origin: parseNumberArray(get('origin', '0.5,0.5')),
    sourceRect: parseNumberArray(get('sourcerect', null)),
    texture: get('texture', ''),
  };
};

export const parseLimbAttributes = createLimbAttributeParser(createAttributeGetter);
export const parseLimbAttributesFromXml2js = createLimbAttributeParser(createXml2jsAttributeGetter);

const createJointAttributeParser = (attributeGetter) => (element) => {
  if (!element) return null;
  const get = attributeGetter(element);
  return {
    limb1: get('limb1', ''),
    limb2: get('limb2', ''),
    limb1Anchor: parseNumberArray(get('limb1anchor', '0,0')),
    limb2Anchor: parseNumberArray(get('limb2anchor', '0,0')),
  };
};

export const parseJointAttributes = createJointAttributeParser(createAttributeGetter);
export const parseJointAttributesFromXml2js = createJointAttributeParser(createXml2jsAttributeGetter);
